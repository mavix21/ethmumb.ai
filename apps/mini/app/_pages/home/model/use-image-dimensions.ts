import * as React from "react";

const MAX_IMAGE_DIMENSION = 360;

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Hook to calculate image dimensions preserving aspect ratio.
 * Scales down to MAX_IMAGE_DIMENSION while maintaining proportions.
 */
export function useImageDimensions(
  imageSrc: string | null,
): ImageDimensions | null {
  const [dimensions, setDimensions] = React.useState<ImageDimensions | null>(
    null,
  );

  React.useEffect(() => {
    if (!imageSrc) {
      setDimensions(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
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

      setDimensions({
        width: Math.round(width),
        height: Math.round(height),
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return dimensions;
}
