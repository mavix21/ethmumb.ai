import { google } from "@ai-sdk/google";
import { APICallError, generateText } from "ai";
import { fetchMutation } from "convex/nextjs";
import { z } from "zod";

import type { Id } from "@ethmumb.ai/convex/_generated/dataModel";
import { api } from "@ethmumb.ai/convex/_generated/api";

import { stylePrompts } from "@/lib/prompts";

// Supported image MIME types for avatar generation
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Valid style keys derived from the prompts configuration
const styleKeys = Object.keys(stylePrompts) as [
  keyof typeof stylePrompts,
  ...(keyof typeof stylePrompts)[],
];

// Schema for validating the request body
const generateAvatarRequestSchema = z.object({
  fid: z.number().optional(),
  image: z
    .string()
    .min(1, "Image is required")
    .refine(
      (val) => val.startsWith("data:image/"),
      "Image must be a valid base64 data URL starting with 'data:image/'",
    )
    .refine(
      (val) => {
        const match = /^data:image\/(\w+);base64,/.exec(val);
        if (!match) return false;
        const mimeType = `image/${match[1]}`;
        return SUPPORTED_IMAGE_TYPES.includes(
          mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number],
        );
      },
      `Image must be one of: ${SUPPORTED_IMAGE_TYPES.join(", ")}`,
    )
    .refine(
      (val) => {
        // Estimate base64 decoded size (base64 is ~4/3 of original)
        const base64Part = val.split(",")[1];
        if (!base64Part) return false;
        const estimatedSize = (base64Part.length * 3) / 4;
        return estimatedSize <= MAX_IMAGE_SIZE_BYTES;
      },
      `Image size must not exceed ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`,
    ),
  style: z.enum(styleKeys, {
    message: `Style must be one of: ${styleKeys.join(", ")}`,
  }),
});

// Response types
interface GenerateAvatarResponse {
  imageUrl: string;
  success: true;
}

interface ErrorResponse {
  error: string;
  details?: string[];
}

/**
 * Parses a base64 data URL and extracts the raw data and media type.
 * @param dataUrl - The full data URL (e.g., "data:image/png;base64,...")
 * @returns The extracted base64 data and media type, or null if parsing fails
 */
function parseDataUrl(dataUrl: string): {
  base64Data: string;
  mediaType: string;
} | null {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    mediaType: match[1],
    base64Data: match[2],
  };
}

/**
 * Creates a JSON error response with consistent structure.
 */
function createErrorResponse(
  error: string,
  status: number,
  details?: string[],
): Response {
  const body: ErrorResponse = { error };
  if (details?.length) {
    body.details = details;
  }
  return Response.json(body, { status });
}

export async function POST(req: Request): Promise<Response> {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("Invalid JSON in request body", 400);
  }

  const parseResult = generateAvatarRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const details = parseResult.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    return createErrorResponse("Validation failed", 400, details);
  }

  const { image, style, fid } = parseResult.data;
  console.warn({ image, style, fid: fid ?? "fid not provided" });
  const prompt = stylePrompts[style];

  // Parse the data URL
  const parsedData = parseDataUrl(image);
  if (!parsedData) {
    return createErrorResponse(
      "Failed to parse image data URL. Ensure it follows the format: data:image/<type>;base64,<data>",
      400,
    );
  }

  const { base64Data, mediaType } = parsedData;

  // Generate the avatar using AI
  let result;
  try {
    result = await generateText({
      model: google("gemini-3-pro-image-preview"),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}\n\nTransform this photo into the described avatar style:`,
            },
            {
              type: "file",
              data: base64Data,
              mediaType: mediaType,
            },
          ],
        },
      ],
    });
  } catch (error) {
    // Handle specific AI SDK errors
    if (error instanceof APICallError) {
      console.error("AI API call failed:", {
        message: error.message,
        statusCode: error.statusCode,
        url: error.url,
      });

      if (error.statusCode === 429) {
        return createErrorResponse(
          "Service temporarily unavailable. Please try again later.",
          503,
        );
      }

      if (error.statusCode === 400) {
        return createErrorResponse(
          "The image could not be processed. Please try a different image.",
          400,
        );
      }
    }

    console.error("Failed to generate avatar:", error);
    return createErrorResponse(
      "Failed to generate avatar. Please try again.",
      500,
    );
  }

  // Extract the generated image from the result
  const generatedFile = result.files.find((file) =>
    file.mediaType.startsWith("image/"),
  );

  if (!generatedFile) {
    console.error("No image in generation result:", {
      hasFiles: result.files.length > 0,
      fileTypes: result.files.map((f) => f.mediaType),
    });
    return createErrorResponse(
      "No image was generated. Please try again with a different image or style.",
      500,
    );
  }

  const generatedImageUrl = `data:${generatedFile.mediaType};base64,${generatedFile.base64}`;

  // Store the generated avatar in the database (non-blocking, best-effort)
  if (fid) {
    void storeGeneratedAvatar(fid, style, generatedFile).catch((error) => {
      console.error("Failed to store generated avatar:", error);
    });
  } else {
    console.error("No fid provided; skipping storage of generated avatar");
  }

  const response: GenerateAvatarResponse = {
    imageUrl: generatedImageUrl,
    success: true,
  };

  return Response.json(response);
}

/**
 * Converts a base64 string to a Blob.
 * @param base64 - The base64-encoded string
 * @param mediaType - The MIME type of the data
 * @returns A Blob containing the decoded data
 */
function base64ToBlob(base64: string, mediaType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mediaType });
}

/**
 * Stores the generated avatar in the database.
 * This is a best-effort operation and should not block the main response.
 * @param fid - The Farcaster ID of the user
 * @param style - The style used for generation
 * @param generatedFile - The generated image file from the AI
 */
async function storeGeneratedAvatar(
  fid: number,
  style: keyof typeof stylePrompts,
  generatedFile: { base64: string; mediaType: string },
): Promise<void> {
  // Get a temporary upload URL from Convex
  const uploadUrl = await fetchMutation(api.storage.generateUploadUrl);
  console.warn("Obtained upload URL from Convex storage", { uploadUrl });

  // Convert base64 to a Blob for upload
  const blob = base64ToBlob(generatedFile.base64, generatedFile.mediaType);

  // Upload the image to Convex storage
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": generatedFile.mediaType,
    },
    body: blob,
  });
  console.warn("Uploaded image to Convex storage", { uploadResponse });

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload failed with status ${uploadResponse.status}: ${await uploadResponse.text()}`,
    );
  }

  const uploadResult: unknown = await uploadResponse.json();

  // Validate the upload response
  const storageIdSchema = z.object({
    storageId: z.string(),
  });
  const parsedResult = storageIdSchema.safeParse(uploadResult);

  if (!parsedResult.success) {
    throw new Error("Invalid upload response: missing storageId");
  }

  // Store the generation record in the database
  const genId = await fetchMutation(api.generations.storeGeneration, {
    fid,
    imageStorageId: parsedResult.data.storageId as Id<"_storage">,
    style,
  });
  console.warn("Stored generation record in database", { genId });
}
