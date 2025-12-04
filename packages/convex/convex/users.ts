import { v } from "convex/values";

import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { fetchUserByFid } from "./lib/neynar";

/**
 * Get or create a user from a Farcaster FID.
 * This is an action because it calls the external Neynar API.
 */
export const getOrCreateUserFromFid = action({
  args: {
    fid: v.number(),
  },
  handler: async (ctx, args): Promise<{ id: string; isNew: boolean }> => {
    const { fid } = args;

    // First, try to find an existing user by farcasterFid
    const existingUser = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "user",
        where: [
          {
            field: "farcasterFid",
            operator: "eq",
            value: fid,
          },
        ],
      },
    );

    if (existingUser) {
      return { id: existingUser.id, isNew: false };
    }

    // User doesn't exist, fetch their info from Neynar
    const farcasterUser = await fetchUserByFid(fid);

    if (!farcasterUser) {
      throw new Error(`Could not find Farcaster user with FID ${fid}`);
    }

    // Create a new user in the Better Auth user table
    const now = Date.now();
    const newUser = await ctx.runMutation(
      components.betterAuth.adapter.create,
      {
        input: {
          model: "user",
          data: {
            name:
              farcasterUser.display_name ||
              farcasterUser.username ||
              `fid:${fid}`,
            email: `${fid}@farcaster.local`, // Placeholder email for Farcaster-only users
            emailVerified: false,
            image: farcasterUser.pfp_url ?? null,
            createdAt: now,
            updatedAt: now,
            farcasterFid: fid,
            farcasterUsername: farcasterUser.username ?? null,
            farcasterDisplayName: farcasterUser.display_name ?? null,
          },
        },
      },
    );

    // Also create a record in the farcaster table for additional data
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "farcaster",
        data: {
          userId: newUser.id,
          fid: fid,
          username: farcasterUser.username ?? null,
          displayName: farcasterUser.display_name ?? null,
          avatarUrl: farcasterUser.pfp_url ?? null,
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    return { id: newUser.id, isNew: true };
  },
});

/**
 * Update notification details for a user (used for Farcaster notifications).
 */
export const updateNotificationDetails = action({
  args: {
    fid: v.number(),
    notificationDetails: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "farcaster",
        where: [
          {
            field: "fid",
            operator: "eq",
            value: args.fid,
          },
        ],
        update: {
          notificationDetails: args.notificationDetails,
          updatedAt: Date.now(),
        },
      },
    });
  },
});

/**
 * Remove notification details for a user (when they disable notifications).
 */
export const removeNotificationDetails = action({
  args: {
    fid: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "farcaster",
        where: [
          {
            field: "fid",
            operator: "eq",
            value: args.fid,
          },
        ],
        update: {
          notificationDetails: null,
          updatedAt: Date.now(),
        },
      },
    });
  },
});
