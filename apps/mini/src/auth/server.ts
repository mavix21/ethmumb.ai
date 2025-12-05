import "server-only";

import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";

import { createAuth } from "@ethmumb.ai/convex/auth";

export const getToken = () => {
  return getTokenNextjs(createAuth);
};
