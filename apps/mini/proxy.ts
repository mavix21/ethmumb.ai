import type { Address } from "viem";
import { facilitator } from "@coinbase/x402";
import { paymentMiddleware } from "x402-next";

import { env } from "@/env";

const payTo = env.RESOURCE_WALLET_ADDRESS as Address;

export const proxy = paymentMiddleware(
  payTo,
  {
    "/api/generate-avatar": {
      price: "$0.2",
      network: "base",
      config: {
        description: "Generate ETHMumbai Avatar",
      },
    },
  },
  facilitator,
);

export const config = {
  matcher: ["/api/generate-avatar"],
};
