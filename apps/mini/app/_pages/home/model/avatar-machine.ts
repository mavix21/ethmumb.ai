import type * as nsfwjs from "nsfwjs";
import imageCompression from "browser-image-compression";
import { and, assign, fromPromise, setup } from "xstate";

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

type AvatarErrorType =
  | "payment"
  | "payment_rejected"
  | "insufficient_balance"
  | "wallet_not_connected"
  | "processing"
  | "nsfw"
  | "analysis";

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

/**
 * Parse x402 payment errors into specific error types
 */
function parsePaymentError(error: unknown): AvatarError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("rejected") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("cancelled") ||
    lowerMessage.includes("user rejected")
  ) {
    return createError(
      "payment_rejected",
      "Payment was rejected. Please try again.",
      true,
    );
  }

  if (
    lowerMessage.includes("insufficient") ||
    lowerMessage.includes("balance")
  ) {
    return createError(
      "insufficient_balance",
      "Insufficient USDC balance. Please add funds and try again.",
      true,
    );
  }

  // Generic payment error
  return createError("payment", `Payment failed: ${message}`, true);
}

// ============================================================================
// Types
// ============================================================================

/**
 * Fetch function wrapped with x402 payment handling.
 * Uses x402's return type which is narrower than globalThis.fetch
 */
export type FetchWithPayment = (
  input: RequestInfo,
  init?: RequestInit,
) => Promise<Response>;

export interface AvatarMachineInput {
  fetchWithPayment: FetchWithPayment | null;
}

// ============================================================================
// Context & Events
// ============================================================================

export interface AvatarContext {
  fid: number | null;
  selectedStyle: StyleId;
  uploadedImage: string | null; // Original image for display (never mutated after upload)
  uploadedFile: File | null;
  compressedImageForApi: string | null; // Compressed image for API transport
  generatedImage: string | null;
  generationId: string | null;
  error: AvatarError | null;
  nsfwModel: nsfwjs.NSFWJS | null;
  isModelLoading: boolean;
  nsfwScore: number | null;
  // x402 payment fetch - injected from React context
  fetchWithPayment: FetchWithPayment | null;
}

export type AvatarEvent =
  | { type: "SELECT_STYLE"; style: StyleId }
  | { type: "FILE_SELECTED"; image: string; file: File }
  | { type: "CONFIRM_PAY"; fid?: number }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "START_OVER" }
  | { type: "WALLET_CONNECTED"; fetchWithPayment: FetchWithPayment }
  | { type: "WALLET_DISCONNECTED" };

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
  fid?: number;
  fetchWithPayment: FetchWithPayment;
}

// Response schema for the generate-avatar API
interface GenerateAvatarResponse {
  imageUrl: string;
  generationId: string | null;
  success: true;
}

interface GenerateAvatarErrorResponse {
  error: string;
  details?: string[];
}

interface GenerateAvatarResult {
  imageUrl: string;
  generationId: string | null;
}

/**
 * Generate avatar actor - handles x402 payment + generation.
 *
 * This uses fromPromise which blocks during the entire x402 flow:
 * 1. First request returns 402 with payment requirements
 * 2. x402-fetch prompts wallet for signature (user sees popup)
 * 3. After signature, request is re-sent with payment header
 * 4. Server generates the image and returns the response
 *
 * The UI stays in the "generating" state during this entire process.
 */
const generateAvatarActor = fromPromise<GenerateAvatarResult, ServiceInput>(
  async ({ input }) => {
    const response = await input.fetchWithPayment("/api/generate-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: input.image,
        style: input.style,
        fid: input.fid,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as GenerateAvatarErrorResponse;
      console.error("Avatar generation failed:", errorData);
      throw new Error(errorData.error || "Failed to generate avatar");
    }

    const data = (await response.json()) as GenerateAvatarResponse;
    return { imageUrl: data.imageUrl, generationId: data.generationId };
  },
);

// ============================================================================
// Machine Definition
// ============================================================================

export const avatarMachine = setup({
  types: {
    context: {} as AvatarContext,
    events: {} as AvatarEvent,
    input: {} as AvatarMachineInput,
  },
  actors: {
    loadModel: loadModelActor,
    analyzeImage: analyzeImageActor,
    generateAvatarActor: generateAvatarActor,
  },
  guards: {
    hasUploadedFile: ({ context }) => context.uploadedFile !== null,
    hasUploadedImage: ({ context }) => context.uploadedImage !== null,
    walletConnected: ({ context }) => context.fetchWithPayment !== null,
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
      generatedImage: (
        _,
        params: { image: string; generationId: string | null },
      ) => params.image,
      generationId: (
        _,
        params: { image: string; generationId: string | null },
      ) => params.generationId,
    }),
    setError: assign({
      error: (_, params: { error: AvatarError }) => params.error,
    }),
    clearError: assign({
      error: () => null,
    }),
    resetContext: assign({
      fid: () => null,
      uploadedImage: () => null,
      uploadedFile: () => null,
      compressedImageForApi: () => null,
      generatedImage: () => null,
      generationId: () => null,
      error: () => null,
      nsfwScore: () => null,
    }),
    setFid: assign({
      fid: ({ event }) => {
        if (event.type === "CONFIRM_PAY") return event.fid ?? null;
        return null;
      },
    }),
    setFetchWithPayment: assign({
      fetchWithPayment: ({
        event,
      }: {
        event: AvatarEvent;
      }): FetchWithPayment | null => {
        if (event.type === "WALLET_CONNECTED") return event.fetchWithPayment;
        return null;
      },
    }),
    clearFetchWithPayment: assign({
      fetchWithPayment: () => null,
    }),
  },
}).createMachine({
  id: "avatarMachine",
  initial: "idle",
  context: ({ input }) => ({
    fid: null,
    selectedStyle: STYLES.CLASSIC_BEST,
    uploadedImage: null,
    uploadedFile: null,
    compressedImageForApi: null,
    generatedImage: null,
    generationId: null,
    error: null,
    nsfwModel: null,
    isModelLoading: true,
    nsfwScore: null,
    fetchWithPayment: input.fetchWithPayment,
  }),
  // Global event handlers for wallet connection changes
  on: {
    WALLET_CONNECTED: {
      actions: "setFetchWithPayment",
    },
    WALLET_DISCONNECTED: {
      actions: "clearFetchWithPayment",
    },
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
              // Store compressed image separately for API transport
              // Keep uploadedImage unchanged for display
              compressedImageForApi: ({ event }) =>
                event.output.compressedDataUrl,
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
          target: "generating",
          guard: and(["hasUploadedImage", "walletConnected"]),
          actions: "setFid",
        },
        CANCEL: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    // User clicked "Generate" - x402 payment flow is happening
    // This state covers: wallet popup, payment confirmation, and image generation
    generating: {
      invoke: {
        id: "generator",
        src: "generateAvatarActor",
        input: ({ context }) => {
          // Use compressed image for API, fall back to original if compression failed
          const imageForApi =
            context.compressedImageForApi ?? context.uploadedImage;
          if (!imageForApi) {
            throw new Error("No image uploaded - this should never happen");
          }
          if (!context.fetchWithPayment) {
            throw new Error("Wallet not connected - this should never happen");
          }
          return {
            image: imageForApi,
            style: context.selectedStyle,
            fid: context.fid ?? undefined,
            fetchWithPayment: context.fetchWithPayment,
          };
        },
        onDone: {
          target: "success",
          actions: assign({
            generatedImage: ({ event }) => event.output.imageUrl,
            generationId: ({ event }) => event.output.generationId,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => parsePaymentError(event.error),
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "generating",
          guard: and(["hasUploadedImage", "walletConnected"]),
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
