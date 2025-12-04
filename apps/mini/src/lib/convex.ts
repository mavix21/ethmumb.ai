import { ConvexHttpClient } from "convex/browser";

import { env } from "@/env";

/**
 * Convex HTTP client for server-side mutations/queries.
 * Use this in API routes, server actions, etc.
 */
export const convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
