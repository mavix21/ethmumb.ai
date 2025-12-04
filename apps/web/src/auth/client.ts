import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { siweClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { siweWalletAgnosticClient } from "@myapp/better-auth-siwe-wallet-agnostic/client";

export const authClient = createAuthClient({
  plugins: [siweClient(), siweWalletAgnosticClient(), convexClient()],
  fetchOptions: {
    credentials: "include",
  },
});
