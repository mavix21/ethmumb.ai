"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";

import "@coinbase/onchainkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cookieToInitialState, WagmiProvider } from "wagmi";

import { env } from "@/env";

import { getConfig } from "../_config/wagmi";

export function OnchainKitClientProvider({
  children,
  cookie,
}: {
  children: ReactNode;
  cookie: string | null;
}) {
  const [config] = React.useState(() => getConfig());
  const [queryClient] = React.useState(() => new QueryClient());

  const initialState = cookieToInitialState(config, cookie);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          projectId={env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              name: env.NEXT_PUBLIC_APPLICATION_NAME,
            },
            wallet: {
              display: "modal",
              preference: "smartWalletOnly",
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
