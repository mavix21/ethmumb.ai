import type * as nsfwjs from "nsfwjs";
import type { Address } from "viem";
import type { PaymentRequirements, Signer } from "x402/types";
import imageCompression from "browser-image-compression";
import {
  preparePaymentHeader,
  selectPaymentRequirements,
  signPaymentHeader,
} from "x402/client";
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

// x402 protocol version
const X402_VERSION = 1;

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
  | "payment_discovery"
  | "payment_signing"
  | "payment_rejected"
  | "insufficient_balance"
  | "wallet_not_connected"
  | "generation"
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
 * Parse x402 payment signing errors into specific error types
 */
function parsePaymentSigningError(error: unknown): AvatarError {
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

  // Generic payment signing error
  return createError("payment_signing", `Payment failed: ${message}`, true);
}

/**
 * Parse generation errors into specific error types
 */
function parseGenerationError(error: unknown): AvatarError {
  const message = error instanceof Error ? error.message : String(error);
  return createError("generation", `Generation failed: ${message}`, true);
}

// ============================================================================
// Types
// ============================================================================

/**
 * Wallet client type for signing x402 payments.
 * Compatible with wagmi's getWalletClient return type.
 */
export type SignerWallet = Signer;

export interface AvatarMachineInput {
  walletClient: SignerWallet | null;
  walletAddress: Address | null;
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
  // Wallet for x402 payment signing
  walletClient: SignerWallet | null;
  walletAddress: Address | null;
  // x402 payment flow intermediate state
  paymentRequirements: PaymentRequirements | null;
  paymentHeader: string | null;
}

export type AvatarEvent =
  | { type: "SELECT_STYLE"; style: StyleId }
  | { type: "FILE_SELECTED"; image: string; file: File }
  | { type: "CONFIRM_PAY"; fid?: number }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "START_OVER" }
  | {
      type: "WALLET_CONNECTED";
      walletClient: SignerWallet;
      walletAddress: Address;
    }
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

// x402 402 Payment Required response schema
interface X402Response {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
}

// ============================================================================
// Phase 1: Discover Payment Requirements Actor
// ============================================================================

type DiscoverPaymentInput = ServiceInput;

/**
 * Makes initial request to get 402 response with payment requirements.
 * This step does NOT involve the wallet - just discovering what payment is needed.
 */
const discoverPaymentActor = fromPromise<
  PaymentRequirements,
  DiscoverPaymentInput
>(async ({ input }) => {
  const response = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: input.image,
      style: input.style,
      fid: input.fid,
    }),
  });

  // We expect a 402 Payment Required response
  if (response.status !== 402) {
    throw new Error(`Expected 402 Payment Required, got ${response.status}`);
  }

  const json: unknown = await response.json();

  // Validate the response shape
  if (
    typeof json !== "object" ||
    json === null ||
    !("accepts" in json) ||
    !Array.isArray(json.accepts) ||
    json.accepts.length === 0
  ) {
    throw new Error("No payment options available");
  }

  const x402Response = json as X402Response;

  // Select the best payment requirement (prefers USDC on Base)
  return selectPaymentRequirements(x402Response.accepts, "base", "exact");
});

// ============================================================================
// Phase 2: Authorize Payment Actor (wallet signing)
// ============================================================================

interface AuthorizePaymentInput {
  walletClient: SignerWallet;
  walletAddress: Address;
  paymentRequirements: PaymentRequirements;
}

/**
 * Creates and signs the payment header using the wallet.
 * This is when the user sees the wallet popup to approve the payment.
 */
const authorizePaymentActor = fromPromise<string, AuthorizePaymentInput>(
  async ({ input }) => {
    // Step 1: Prepare unsigned payment header
    const unsignedPaymentHeader = preparePaymentHeader(
      input.walletAddress,
      X402_VERSION,
      input.paymentRequirements,
    );

    // Step 2: Sign with wallet (this triggers the wallet popup)
    const signedPaymentHeader = await signPaymentHeader(
      input.walletClient,
      input.paymentRequirements,
      unsignedPaymentHeader,
    );

    return signedPaymentHeader;
  },
);

// ============================================================================
// Phase 3: Execute Generation Actor
// ============================================================================

interface ExecuteGenerationInput extends ServiceInput {
  paymentHeader: string;
}

/**
 * Sends the final request with payment header to generate the avatar.
 * Payment has already been authorized at this point.
 */
const executeGenerationActor = fromPromise<
  GenerateAvatarResult,
  ExecuteGenerationInput
>(async ({ input }) => {
  const response = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-PAYMENT": input.paymentHeader,
    },
    body: JSON.stringify({
      image: input.image,
      style: input.style,
      fid: input.fid,
    }),
  });

  if (!response.ok) {
    const errorJson: unknown = await response.json();
    const errorData = errorJson as GenerateAvatarErrorResponse;
    console.error("Avatar generation failed:", errorData);
    throw new Error(errorData.error || "Failed to generate avatar");
  }

  const dataJson: unknown = await response.json();
  const data = dataJson as GenerateAvatarResponse;
  return { imageUrl: data.imageUrl, generationId: data.generationId };
});

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
    discoverPayment: discoverPaymentActor,
    authorizePayment: authorizePaymentActor,
    executeGeneration: executeGenerationActor,
  },
  guards: {
    hasUploadedFile: ({ context }) => context.uploadedFile !== null,
    hasUploadedImage: ({ context }) => context.uploadedImage !== null,
    walletConnected: ({ context }) => context.walletClient !== null,
    hasPaymentRequirements: ({ context }) =>
      context.paymentRequirements !== null,
    hasPaymentHeader: ({ context }) => context.paymentHeader !== null,
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
      paymentRequirements: () => null,
      paymentHeader: () => null,
    }),
    setFid: assign({
      fid: ({ event }) => {
        if (event.type === "CONFIRM_PAY") return event.fid ?? null;
        return null;
      },
    }),
    setWalletClient: assign({
      walletClient: ({ event }) => {
        if (event.type === "WALLET_CONNECTED") return event.walletClient;
        return null;
      },
      walletAddress: ({ event }) => {
        if (event.type === "WALLET_CONNECTED") return event.walletAddress;
        return null;
      },
    }),
    clearWalletClient: assign({
      walletClient: () => null,
      walletAddress: () => null,
    }),
    setPaymentRequirements: assign({
      paymentRequirements: (_, params: { requirements: PaymentRequirements }) =>
        params.requirements,
    }),
    setPaymentHeader: assign({
      paymentHeader: (_, params: { header: string }) => params.header,
    }),
    clearPaymentState: assign({
      paymentRequirements: () => null,
      paymentHeader: () => null,
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
    walletClient: input.walletClient,
    walletAddress: input.walletAddress,
    paymentRequirements: null,
    paymentHeader: null,
  }),
  // Global event handlers for wallet connection changes
  on: {
    WALLET_CONNECTED: {
      actions: "setWalletClient",
    },
    WALLET_DISCONNECTED: {
      actions: "clearWalletClient",
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
          actions: ["setFid", "clearPaymentState"],
        },
        CANCEL: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
    // User clicked "Generate" - hierarchical state for the x402 payment flow
    // Substates: discovering -> awaitingPayment -> executing
    generating: {
      initial: "discovering",
      states: {
        // Phase 1: Discover payment requirements from server
        discovering: {
          invoke: {
            id: "discoverer",
            src: "discoverPayment",
            input: ({ context }) => {
              const imageForApi =
                context.compressedImageForApi ?? context.uploadedImage;
              if (!imageForApi) {
                throw new Error("No image uploaded - this should never happen");
              }
              return {
                image: imageForApi,
                style: context.selectedStyle,
                fid: context.fid ?? undefined,
              };
            },
            onDone: {
              target: "awaitingPayment",
              actions: assign({
                paymentRequirements: ({ event }) => event.output,
              }),
            },
            onError: {
              target: "#avatarMachine.error.discovery",
              actions: assign({
                error: ({ event }) =>
                  createError(
                    "payment_discovery",
                    event.error instanceof Error
                      ? event.error.message
                      : "Failed to get payment requirements",
                    true,
                  ),
              }),
            },
          },
        },
        // Phase 2: User approves payment in wallet
        awaitingPayment: {
          invoke: {
            id: "authorizer",
            src: "authorizePayment",
            input: ({ context }) => {
              if (!context.walletClient) {
                throw new Error(
                  "Wallet not connected - this should never happen",
                );
              }
              if (!context.walletAddress) {
                throw new Error(
                  "Wallet address not available - this should never happen",
                );
              }
              if (!context.paymentRequirements) {
                throw new Error(
                  "Payment requirements not available - this should never happen",
                );
              }
              return {
                walletClient: context.walletClient,
                walletAddress: context.walletAddress,
                paymentRequirements: context.paymentRequirements,
              };
            },
            onDone: {
              target: "executing",
              actions: assign({
                paymentHeader: ({ event }) => event.output,
              }),
            },
            onError: {
              target: "#avatarMachine.error.payment",
              actions: assign({
                error: ({ event }) => parsePaymentSigningError(event.error),
              }),
            },
          },
        },
        // Phase 3: Execute the generation with payment header
        executing: {
          invoke: {
            id: "executor",
            src: "executeGeneration",
            input: ({ context }) => {
              const imageForApi =
                context.compressedImageForApi ?? context.uploadedImage;
              if (!imageForApi) {
                throw new Error("No image uploaded - this should never happen");
              }
              if (!context.paymentHeader) {
                throw new Error(
                  "Payment header not available - this should never happen",
                );
              }
              return {
                image: imageForApi,
                style: context.selectedStyle,
                fid: context.fid ?? undefined,
                paymentHeader: context.paymentHeader,
              };
            },
            onDone: {
              target: "#avatarMachine.success",
              actions: assign({
                generatedImage: ({ event }) => event.output.imageUrl,
                generationId: ({ event }) => event.output.generationId,
              }),
            },
            onError: {
              target: "#avatarMachine.error.generation",
              actions: assign({
                error: ({ event }) => parseGenerationError(event.error),
              }),
            },
          },
        },
      },
    },
    // Error states - each phase has its own error substate for appropriate retry behavior
    error: {
      initial: "generic",
      states: {
        generic: {},
        discovery: {
          // Retry goes back to discovering
        },
        payment: {
          // Retry goes back to awaitingPayment (reuses discovered requirements)
        },
        generation: {
          // Retry goes back to executing (reuses existing payment header)
        },
      },
      on: {
        RETRY: [
          // If we have a payment header, retry just the generation
          {
            target: "generating.executing",
            guard: and([
              "hasUploadedImage",
              "walletConnected",
              "hasPaymentHeader",
            ]),
          },
          // If we have payment requirements but no header, retry signing
          {
            target: "generating.awaitingPayment",
            guard: and([
              "hasUploadedImage",
              "walletConnected",
              "hasPaymentRequirements",
            ]),
          },
          // Otherwise, start fresh from discovery
          {
            target: "generating.discovering",
            guard: and(["hasUploadedImage", "walletConnected"]),
          },
        ],
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
