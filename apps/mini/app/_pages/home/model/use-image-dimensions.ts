import * as React from "react";

const MAX_IMAGE_DIMENSION = 360;
const DEFAULT_DIMENSION = 300;

interface ImageDimensions {
  width: number;
  height: number;
}

interface UseImageDimensionsResult {
  dimensions: ImageDimensions | null;
  isLoading: boolean;
  error: boolean;
}

function calculateDimensions(
  naturalWidth: number,
  naturalHeight: number,
): ImageDimensions {
  const aspectRatio = naturalWidth / naturalHeight;

  let width: number;
  let height: number;

  if (naturalWidth > naturalHeight) {
    width = Math.min(naturalWidth, MAX_IMAGE_DIMENSION);
    height = width / aspectRatio;
  } else {
    height = Math.min(naturalHeight, MAX_IMAGE_DIMENSION);
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Hook to calculate image dimensions preserving aspect ratio.
 * Scales down to MAX_IMAGE_DIMENSION while maintaining proportions.
 * Returns loading state and handles errors gracefully with fallback dimensions.
 */
export function useImageDimensions(
  imageSrc: string | null,
): UseImageDimensionsResult {
  const [state, setState] = React.useState<{
    dimensions: ImageDimensions | null;
    hasLoaded: boolean;
    error: boolean;
    currentSrc: string | null;
  }>({
    dimensions: null,
    hasLoaded: false,
    error: false,
    currentSrc: null,
  });

  // Derive isLoading: we have a source but haven't loaded it yet
  // OR the source changed and we need to load the new one
  const isLoading =
    Boolean(imageSrc) && (!state.hasLoaded || state.currentSrc !== imageSrc);

  React.useEffect(() => {
    if (!imageSrc) {
      setState({
        dimensions: null,
        hasLoaded: true, // No image = nothing to load
        error: false,
        currentSrc: null,
      });
      return;
    }

    // Reset state for new source
    setState((prev) => ({
      ...prev,
      hasLoaded: false,
      error: false,
      currentSrc: imageSrc,
    }));

    let isCancelled = false;

    const img = new window.Image();

    const handleLoad = () => {
      if (isCancelled) return;

      const { naturalWidth, naturalHeight } = img;

      // Validate dimensions are valid
      const newDimensions =
        naturalWidth > 0 && naturalHeight > 0
          ? calculateDimensions(naturalWidth, naturalHeight)
          : { width: DEFAULT_DIMENSION, height: DEFAULT_DIMENSION };

      setState((prev) => ({
        ...prev,
        dimensions: newDimensions,
        hasLoaded: true,
      }));
    };

    const handleError = () => {
      if (isCancelled) return;
      console.warn("Failed to load image for dimensions:", imageSrc);
      // Set fallback dimensions so the image still renders
      setState((prev) => ({
        ...prev,
        dimensions: { width: DEFAULT_DIMENSION, height: DEFAULT_DIMENSION },
        error: true,
        hasLoaded: true,
      }));
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // Set crossOrigin before src to handle CORS properly
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    // If image is already cached, onload might have fired synchronously
    // or it might fire on next tick. Handle the case where it's complete.
    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
    }

    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  return { dimensions: state.dimensions, isLoading, error: state.error };
}
