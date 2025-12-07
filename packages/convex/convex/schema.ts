import { defineSchema } from "convex/server";

import { generations } from "./tables/generations";

export const schema = defineSchema({
  generations,
});

export default schema;
