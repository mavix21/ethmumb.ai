import { createClient, GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";

import { initAuth } from "@myapp/auth";

import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authSchema from "./betterAuth/generatedSchema";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth as any,
  {
    local: {
      schema: authSchema,
    },
  },
);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  opts?: { optionsOnly?: boolean },
) => {
  return initAuth({
    baseUrl: siteUrl,
    database: authComponent.adapter(ctx),
    secret: process.env.BETTER_AUTH_SECRET,
    optionsOnly: opts?.optionsOnly ?? false,
    extraPlugins: [convex()],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
