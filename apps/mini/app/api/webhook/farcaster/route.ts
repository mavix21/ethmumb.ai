import type {
  ParseWebhookEvent,
  ParseWebhookEventResult,
} from "@farcaster/miniapp-node";
import type { NextRequest } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";

import { api } from "@myapp/convex/_generated/api";

import { env } from "@/env";
import { convexClient } from "@/lib/convex";
import { sendFarcasterNotification } from "@/lib/farcaster/farcaster-notifications";

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const requestJson = await request.json();
  console.log("[webhook/farcaster] received:", requestJson);

  let data: ParseWebhookEventResult;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(
        "[webhook/farcaster] failed to parse webhook event:",
        e.message,
      );
      return Response.json(
        { status: "error", message: e.message },
        { status: 400 },
      );
    }

    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 401 },
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      default:
        return Response.json(
          { success: false, error: "Unknown error" },
          { status: 500 },
        );
    }
  }

  console.log("[webhook/farcaster] parsed event data", data);

  const { fid, event } = data;
  const { id: convexId, isNew } = await convexClient.action(
    api.users.getOrCreateUserFromFid,
    {
      fid,
    },
  );

  try {
    switch (event.event) {
      case "miniapp_added": {
        // User added the mini app
        console.log(
          "[webhook/farcaster] miniapp_added - user:",
          convexId,
          "isNew:",
          isNew,
        );

        // If notification details are provided, save them
        if (event.notificationDetails) {
          await convexClient.action(api.users.updateNotificationDetails, {
            fid,
            notificationDetails: JSON.stringify(event.notificationDetails),
          });
          await sendFarcasterNotification({
            fid,
            title: `Welcome to ${env.NEXT_PUBLIC_APPLICATION_NAME}!`,
            body: isNew
              ? "Thanks for adding our mini app. We're excited to have you on board!"
              : "Welcome back!",
            notificationDetails: event.notificationDetails,
          });
        }
        break;
      }

      case "miniapp_removed": {
        // User removed the mini app - optionally clean up notification details
        await convexClient.action(api.users.removeNotificationDetails, { fid });
        console.log("[webhook/farcaster] miniapp_removed - fid:", fid);
        break;
      }

      case "notifications_enabled": {
        // User enabled notifications
        await convexClient.action(api.users.updateNotificationDetails, {
          fid,
          notificationDetails: JSON.stringify(event.notificationDetails),
        });
        console.log("[webhook/farcaster] notifications_enabled - fid:", fid);
        break;
      }

      case "notifications_disabled": {
        // User disabled notifications
        await convexClient.action(api.users.removeNotificationDetails, { fid });
        console.log("[webhook/farcaster] notifications_disabled - fid:", fid);
        break;
      }

      default:
        console.log("[webhook/farcaster] unhandled event:", event);
        return Response.json(
          { success: false, error: "Unknown event" },
          { status: 400 },
        );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[webhook/farcaster] error handling event:", error);
    return Response.json(
      { success: false, error: "Failed to process event" },
      { status: 500 },
    );
  }
}
