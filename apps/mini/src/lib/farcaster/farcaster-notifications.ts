import type {
  MiniAppNotificationDetails,
  SendNotificationRequest,
} from "@farcaster/miniapp-sdk";
import { sendNotificationResponseSchema } from "@farcaster/miniapp-sdk";
import ky from "ky";
import { v4 as uuidv4 } from "uuid";

import { env } from "@/env";

import type { SendFarcasterNotificationResult } from "./types";

/**
 * Send a notification to a Farcaster user.
 *
 * @param fid - The Farcaster user ID
 * @param title - The title of the notification
 * @param body - The body of the notification
 * @param targetUrl - The URL to redirect to when the notification is clicked (optional)
 * @param notificationDetails - The notification details of the user (required)
 * @returns The result of the notification
 */
export async function sendFarcasterNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationDetails,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
  notificationDetails?: MiniAppNotificationDetails | null;
}): Promise<SendFarcasterNotificationResult> {
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const url = notificationDetails.url;
  const tokens = [notificationDetails.token];

  const response = await ky.post(url, {
    json: {
      notificationId: uuidv4(),
      title,
      body,
      targetUrl: targetUrl ?? env.SITE_URL,
      tokens,
    } satisfies SendNotificationRequest,
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (!responseBody.success) {
      console.error(
        `Error sending notification to ${fid}: malformed response`,
        responseBody.error.errors,
      );
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.invalidTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: invalid tokens`,
        responseBody.data.result.invalidTokens,
      );
      return {
        state: "invalid_token",
        invalidTokens: responseBody.data.result.invalidTokens,
      };
    }

    if (responseBody.data.result.rateLimitedTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: rate limited`,
        responseBody.data.result.rateLimitedTokens,
      );
      return {
        state: "rate_limit",
        rateLimitedTokens: responseBody.data.result.rateLimitedTokens,
      };
    }

    return { state: "success" };
  }

  console.error(`Error sending notification to ${fid}: ${response.status}`);
  return { state: "error", error: responseJson };
}

/**
 * Send a notification to a Farcaster user.
 *
 * @param title - The title of the notification
 * @param body - The body of the notification
 * @param targetUrl - The URL to redirect to when the notification is clicked (optional)
 * @returns The result of the notification
 */
export async function sendNotificationToAllUsers({
  title,
  body,
  targetUrl,
  users,
}: {
  title: string;
  body: string;
  targetUrl?: string;
  users?: {
    farcasterFid: number;
    farcasterNotificationDetails: MiniAppNotificationDetails[];
  }[];
}) {
  if (!users) {
    return {
      message: "No users found",
      successfulTokens: [],
      invalidTokens: [],
      rateLimitedTokens: [],
      errorFids: [],
    };
  }

  // Build mapping: url -> tokens[] and token -> fids (for error attribution)
  const urlToTokens = new Map<string, string[]>();
  const tokenToFids = new Map<string, Set<number>>();

  for (const user of users) {
    const details = user.farcasterNotificationDetails;
    for (const detail of details) {
      // map url -> tokens
      const list = urlToTokens.get(detail.url) ?? [];
      list.push(detail.token);
      urlToTokens.set(detail.url, list);

      // map token -> fids
      const existingFids = tokenToFids.get(detail.token) ?? new Set<number>();
      existingFids.add(user.farcasterFid);
      tokenToFids.set(detail.token, existingFids);
    }
  }

  const successfulTokens: string[] = [];
  const invalidTokens: string[] = [];
  const rateLimitedTokens: string[] = [];
  const errorFids: number[] = [];

  // Helper to chunk an array into batches of N
  const chunk = <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  for (const [url, tokens] of urlToTokens.entries()) {
    const tokenChunks = chunk(tokens, 100);
    for (const tokenChunk of tokenChunks) {
      console.log("Sending notification to chunk: ", url, tokenChunk);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: uuidv4(),
          title: title.slice(0, 32),
          body: body.slice(0, 128),
          targetUrl: targetUrl?.slice(0, 1024) ?? env.SITE_URL,
          tokens: tokenChunk,
        } satisfies SendNotificationRequest),
      });

      if (response.status === 200) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const responseJson = await response.json();
        const responseBody =
          sendNotificationResponseSchema.safeParse(responseJson);
        if (!responseBody.success) {
          console.error(
            "Error sending notification to chunk: malformed response",
            responseBody.error.errors,
          );
          // attribute all fids in this chunk as errored
          const fidsInChunk = new Set<number>();
          for (const t of tokenChunk) {
            const fids = tokenToFids.get(t);
            if (fids) {
              for (const fid of fids) {
                fidsInChunk.add(fid);
              }
            }
          }
          errorFids.push(...Array.from(fidsInChunk));
          continue;
        }

        if (responseBody.data.result.invalidTokens.length > 0) {
          console.error(
            "Error sending notification to chunk: invalid tokens",
            responseBody.data.result.invalidTokens,
          );
          invalidTokens.push(...responseBody.data.result.invalidTokens);
        }

        if (responseBody.data.result.rateLimitedTokens.length > 0) {
          console.warn(
            "Error sending notification to chunk: rate limited",
            responseBody.data.result.rateLimitedTokens,
          );
          rateLimitedTokens.push(...responseBody.data.result.rateLimitedTokens);
        }

        successfulTokens.push(...responseBody.data.result.successfulTokens);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = await response.json();
        console.error(
          "Error sending notification to chunk: unknown error",
          JSON.stringify(errorData),
        );
        // attribute all fids in this chunk as errored
        const fidsInChunk = new Set<number>();
        for (const t of tokenChunk) {
          const fids = tokenToFids.get(t);
          if (fids) {
            for (const fid of fids) {
              fidsInChunk.add(fid);
            }
          }
        }
        errorFids.push(...Array.from(fidsInChunk));
      }
    }
  }

  return {
    message: "Sent notifications to all users",
    successfulTokens,
    invalidTokens,
    rateLimitedTokens,
    errorFids,
  };
}
