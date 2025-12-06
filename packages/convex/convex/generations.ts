import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const storeGeneration = mutation({
  args: {
    fid: v.number(),
    imageStorageId: v.id("_storage"),
    style: v.union(
      v.literal("classic-best"),
      v.literal("cyber-link"),
      v.literal("heritage"),
    ),
  },
  handler: async (ctx, args) => {
    // Store the generation in the database
    return await ctx.db.insert("generations", {
      fid: args.fid,
      imageStorageId: args.imageStorageId,
      style: args.style,
    });
  },
});
