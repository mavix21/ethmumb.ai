import { defineTable } from "convex/server";
import { v } from "convex/values";

export const generations = defineTable({
  fid: v.number(),
  imageStorageId: v.id("_storage"),
  style: v.union(
    v.literal("classic-best"),
    v.literal("cyber-link"),
    v.literal("heritage"),
  ),
}).index("by_fid", ["fid"]);
