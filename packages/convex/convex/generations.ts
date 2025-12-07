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

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("generations", args.id);
    if (!normalizedId) return null;

    const generation = await ctx.db.get(normalizedId);
    if (!generation) return null;

    const imageUrl = await ctx.storage.getUrl(generation.imageStorageId);
    return { ...generation, imageUrl };
  },
});

export const getByFid = query({
  args: { fid: v.number() },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_fid", (q) => q.eq("fid", args.fid))
      .order("desc")
      .collect();

    // Get URLs for all generations
    const generationsWithUrls = await Promise.all(
      generations.map(async (generation) => {
        const imageUrl = await ctx.storage.getUrl(generation.imageStorageId);
        return {
          ...generation,
          imageUrl,
        };
      }),
    );

    return generationsWithUrls;
  },
});
