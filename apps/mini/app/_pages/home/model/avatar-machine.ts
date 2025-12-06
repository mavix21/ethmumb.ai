import type * as nsfwjs from "nsfwjs";
import imageCompression from "browser-image-compression";
import { assign, fromPromise, setup } from "xstate";

// ============================================================================
// Constants
// ============================================================================

export const STYLES = {
  CLASSIC_BEST: "classic-best",
  CYBER_LINK: "cyber-link",
  HERITAGE: "heritage",
} as const;

export type StyleId = (typeof STYLES)[keyof typeof STYLES];

const NSFW_THRESHOLD = 0.7;
const NSFW_CATEGORIES = ["Porn", "Hentai"] as const;

// Compression settings optimized for AI image generation
// Priority: preserve maximum detail for LLM to analyze facial features, lighting, textures
// Secondary: reduce file size for network transport
const COMPRESSION_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 2, // Allow up to 2MB to preserve quality
  maxWidthOrHeight: 1536, // Balance: enough detail for AI, reasonable for low-end devices
  useWebWorker: true, // Offload to web worker (critical for low-end devices)
  preserveExif: false, // Strip metadata for privacy + smaller size
  initialQuality: 0.9, // High quality - AI needs detail for accurate generation
  alwaysKeepResolution: true, // Don't downscale small images
};

// ============================================================================
// Error Types
// ============================================================================

type AvatarErrorType = "payment" | "processing" | "nsfw" | "analysis";

export interface AvatarError {
  type: AvatarErrorType;
  message: string;
  retryable: boolean;
}

const createError = (
  type: AvatarErrorType,
  message: string,
  retryable = true,
): AvatarError => ({
  type,
  message,
  retryable,
});

// ============================================================================
// Context & Events
// ============================================================================

export interface AvatarContext {
  selectedStyle: StyleId;
  uploadedImage: string | null;
  uploadedFile: File | null;
  generatedImage: string | null;
  error: AvatarError | null;
  nsfwModel: nsfwjs.NSFWJS | null;
  isModelLoading: boolean;
  nsfwScore: number | null;
}

export type AvatarEvent =
  | { type: "SELECT_STYLE"; style: StyleId }
  | { type: "FILE_SELECTED"; image: string; file: File }
  | { type: "CONFIRM_PAY" }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "START_OVER" };

// ============================================================================
// Helpers
// ============================================================================

async function fileToImage(file: File): Promise<HTMLImageElement> {
  let url: string | null = null;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Clean up on error to prevent memory leak
      if (url) URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    url = URL.createObjectURL(file);
    img.src = url;
  });
}

// ============================================================================
// Actors
// ============================================================================

const loadModelActor = fromPromise<nsfwjs.NSFWJS, void>(async () => {
  const nsfwjsModule = await import("nsfwjs");
  // Load the model - uses default MobileNetV2 model
  const model = await nsfwjsModule.load();
  return model;
});

interface AnalyzeImageInput {
  file: File;
  model: nsfwjs.NSFWJS | null;
}

interface AnalyzeImageOutput {
  isNsfw: boolean;
  score: number;
  compressedFile: File;
  compressedDataUrl: string;
}

const ANALYSIS_MIN_DELAY_MS = 1500;

const analyzeImageActor = fromPromise<AnalyzeImageOutput, AnalyzeImageInput>(
  async ({ input }) => {
    const model = input.model;

    if (!model) {
      throw new Error("NSFW model not available");
    }

    // Run compression, analysis, and minimum delay in parallel
    // Compression happens first, then NSFW analysis uses the compressed image
    const [result] = await Promise.all([
      (async () => {
        // Step 1: Compress the image with Squoosh-like quality settings
        const compressedFile = await imageCompression(
          input.file,
          COMPRESSION_OPTIONS,
        );

        // Step 2: Convert compressed file to data URL for API transport
        const compressedDataUrl =
          await imageCompression.getDataUrlFromFile(compressedFile);

        // Step 3: Analyze the compressed image for NSFW content
        const img = await fileToImage(compressedFile);
        const predictions = await model.classify(img);

        // Find highest inappropriate score
        let maxScore = 0;
        for (const prediction of predictions) {
          if (
            NSFW_CATEGORIES.includes(
              prediction.className as (typeof NSFW_CATEGORIES)[number],
            )
          ) {
            maxScore = Math.max(maxScore, prediction.probability);
          }
        }

        // Clean up
        URL.revokeObjectURL(img.src);

        return {
          isNsfw: maxScore >= NSFW_THRESHOLD,
          score: maxScore,
          compressedFile,
          compressedDataUrl,
        };
      })(),
      new Promise((resolve) => setTimeout(resolve, ANALYSIS_MIN_DELAY_MS)),
    ]);

    return result;
  },
);

interface ServiceInput {
  image: string;
  style: StyleId;
}

// Mock payment service
// TODO: replace with real payment integration
const mockPaymentService = fromPromise<void, ServiceInput>(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return;
});

const mockProcessingService = fromPromise<string, ServiceInput>(
  async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 5% random server-side rejection
    if (Math.random() < 0.05) {
      throw new Error("Server-side content policy violation detected");
    }

    const styleImages: Record<StyleId, string> = {
      [STYLES.CLASSIC_BEST]: "/examples/classic-after.png",
      [STYLES.CYBER_LINK]: "/examples/cyber-after.jpg",
      [STYLES.HERITAGE]: "/examples/heritage-after.jpg",
    };
    return styleImages[input.style];
  },
);

// ============================================================================
// Machine Definition
// ============================================================================

export const avatarMachine = setup({
  types: {
    context: {} as AvatarContext,
    events: {} as AvatarEvent,
  },
  actors: {
    loadModel: loadModelActor,
    analyzeImage: analyzeImageActor,
    paymentService: mockPaymentService,
    processingService: mockProcessingService,
  },
  guards: {
    hasUploadedFile: ({ context }) => context.uploadedFile !== null,
    hasUploadedImage: ({ context }) => context.uploadedImage !== null,
  },
  actions: {
    setStyle: assign({
      selectedStyle: ({ context, event }) => {
        if (event.type === "SELECT_STYLE") return event.style;
        return context.selectedStyle;
      },
    }),
    setUploadedImage: assign({
      uploadedImage: ({ event }) => {
        if (event.type === "FILE_SELECTED") return event.image;
        return null;
      },
      uploadedFile: ({ event }) => {
        if (event.type === "FILE_SELECTED") return event.file;
        return null;
      },
    }),
    setNsfwScore: assign({
      nsfwScore: (_, params: { score: number }) => params.score,
    }),
    setGeneratedImage: assign({
      generatedImage: (_, params: { image: string }) => params.image,
    }),
    setError: assign({
      error: (_, params: { error: AvatarError }) => params.error,
    }),
    clearError: assign({
      error: () => null,
    }),
    resetContext: assign({
      uploadedImage: () => null,
      uploadedFile: () => null,
      generatedImage: () => null,
      error: () => null,
      nsfwScore: () => null,
    }),
  },
}).createMachine({
  id: "avatarMachine",
  initial: "idle",
  context: {
    selectedStyle: STYLES.CLASSIC_BEST,
    uploadedImage: null,
    uploadedFile: null,
    generatedImage: null,
    error: null,
    nsfwModel: null,
    isModelLoading: true,
    nsfwScore: null,
  },
  invoke: {
    id: "modelLoader",
    src: "loadModel",
    onDone: {
      actions: assign({
        nsfwModel: ({ event }) => event.output,
        isModelLoading: () => false,
      }),
    },
    onError: {
      // Model failed to load - continue anyway, will handle in analyzing step
      actions: assign({
        isModelLoading: () => false,
      }),
    },
  },
  states: {
    idle: {
      entry: "clearError",
      on: {
        SELECT_STYLE: {
          actions: "setStyle",
        },
        FILE_SELECTED: {
          target: "analyzing",
          actions: "setUploadedImage",
        },
      },
    },
    analyzing: {
      invoke: {
        id: "analyzer",
        src: "analyzeImage",
        input: ({ context }) => {
          // Safe access - we only reach this state after FILE_SELECTED
          // which guarantees uploadedFile is set
          if (!context.uploadedFile) {
            throw new Error("No file uploaded - this should never happen");
          }
          return {
            file: context.uploadedFile,
            model: context.nsfwModel,
          };
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isNsfw,
            target: "nsfw_violation",
            actions: assign({
              nsfwScore: ({ event }) => event.output.score,
              error: () =>
                createError(
                  "nsfw",
                  "This image contains inappropriate content and cannot be processed.",
                  false,
                ),
            }),
          },
          {
            target: "user_confirming",
            actions: assign({
              nsfwScore: ({ event }) => event.output.score,
              // Update with compressed image data for API transport
              uploadedImage: ({ event }) => event.output.compressedDataUrl,
              uploadedFile: ({ event }) => event.output.compressedFile,
            }),
          },
        ],
        onError: {
          // If analysis fails, proceed to confirming (fail open for UX)
          target: "user_confirming",
        },
      },
      on: {
        CANCEL: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    nsfw_violation: {
      on: {
        RESET: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    user_confirming: {
      on: {
        SELECT_STYLE: {
          actions: "setStyle",
        },
        CONFIRM_PAY: {
          target: "paying",
          guard: "hasUploadedImage",
        },
        CANCEL: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    paying: {
      invoke: {
        id: "payment",
        src: "paymentService",
        input: ({ context }) => {
          if (!context.uploadedImage) {
            throw new Error("No image uploaded - this should never happen");
          }
          return {
            image: context.uploadedImage,
            style: context.selectedStyle,
          };
        },
        onDone: {
          target: "processing",
        },
        onError: {
          target: "error",
          actions: assign({
            error: () =>
              createError("payment", "Payment failed. Please try again.", true),
          }),
        },
      },
      on: {
        CANCEL: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    processing: {
      invoke: {
        id: "processing",
        src: "processingService",
        input: ({ context }) => {
          if (!context.uploadedImage) {
            throw new Error("No image uploaded - this should never happen");
          }
          return {
            image: context.uploadedImage,
            style: context.selectedStyle,
          };
        },
        onDone: {
          target: "success",
          actions: assign({
            generatedImage: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: () =>
              createError(
                "processing",
                "Image processing failed due to server error.",
                true,
              ),
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "paying",
          guard: "hasUploadedImage",
        },
        START_OVER: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    success: {
      on: {
        START_OVER: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
  },
});
