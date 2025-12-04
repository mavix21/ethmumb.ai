import { z } from "zod/v4";

export type SendFarcasterNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "invalid_token"; invalidTokens: string[] }
  | { state: "rate_limit"; rateLimitedTokens: string[] }
  | { state: "success" };

export const farcasterNotificationDetailsSchema = z.object({
  appFid: z.number(),
  url: z.string(),
  token: z.string(),
});

export type FarcasterNotificationDetails = z.infer<
  typeof farcasterNotificationDetailsSchema
>;
