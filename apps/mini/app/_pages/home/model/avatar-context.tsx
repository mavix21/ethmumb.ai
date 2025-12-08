"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { useMachine } from "@xstate/react";
import { useAccount, useConfig } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { wrapFetchWithPayment } from "x402-fetch";

import type {
  AvatarError,
  AvatarEvent,
  FetchWithPayment,
  StyleId,
} from "./avatar-machine";
import type { StyleOption } from "./style-options";
import { avatarMachine } from "./avatar-machine";
import { getStyleById } from "./style-options";

interface AvatarContextValue {
  state: ReturnType<typeof useMachine<typeof avatarMachine>>[0];
  send: (event: AvatarEvent) => void;
  // Convenience helpers
  isIdle: boolean;
  isAnalyzing: boolean;
  isNsfwViolation: boolean;
  isNsfwModelLoading: boolean;
  isUserConfirming: boolean;
  isGenerating: boolean;
  isServerError: boolean;
  isSuccess: boolean;
  isWalletConnected: boolean;
  selectedStyle: StyleId;
  currentStyle: StyleOption;
  uploadedImage: string | null;
  generatedImage: string | null;
  generationId: string | null;
  error: AvatarError | null;
  nsfwScore: number | null;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

// Max payment amount: $0.20 USDC (endpoint costs $0.20)
const MAX_PAYMENT_USDC = BigInt(0.2 * 10 ** 6);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { address, chainId, connector, isConnected } = useAccount();
  // Use the SAME wagmi config that OnchainKit/MiniKit provides - this is critical!
  const wagmiConfig = useConfig();
  const [fetchWithPayment, setFetchWithPayment] =
    React.useState<FetchWithPayment | null>(null);

  // Create the x402-wrapped fetch when wallet is connected
  // Using getWalletClient with the app's wagmi config for MiniKit/TBA compatibility
  React.useEffect(() => {
    async function setupPaymentFetch() {
      if (!isConnected || !address || !chainId || !connector) {
        setFetchWithPayment(null);
        return;
      }

      try {
        // Use the same wagmi config from OnchainKit - NOT a separate config
        const walletClient = await getWalletClient(wagmiConfig, {
          account: address,
          chainId: chainId,
          connector: connector,
        });

        const wrappedFetch = wrapFetchWithPayment(
          fetch,
          walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
          MAX_PAYMENT_USDC,
        );
        setFetchWithPayment(() => wrappedFetch);
      } catch {
        console.error("Failed to set up payment fetch");
        setFetchWithPayment(null);
      }
    }

    void setupPaymentFetch();
  }, [address, chainId, connector, isConnected, wagmiConfig]);
  const [state, send] = useMachine(avatarMachine, {
    input: {
      fetchWithPayment,
    },
  });

  // Sync wallet connection state with machine
  React.useEffect(() => {
    if (fetchWithPayment) {
      send({ type: "WALLET_CONNECTED", fetchWithPayment });
    } else {
      send({ type: "WALLET_DISCONNECTED" });
    }
  }, [fetchWithPayment, send]);

  const value: AvatarContextValue = {
    state,
    send,
    isIdle: state.matches("idle"),
    isAnalyzing: state.matches("analyzing"),
    isNsfwViolation: state.matches("nsfw_violation"),
    isNsfwModelLoading: state.context.isModelLoading,
    isUserConfirming: state.matches("user_confirming"),
    isGenerating: state.matches("generating"),
    isServerError: state.matches("error"),
    isSuccess: state.matches("success"),
    isWalletConnected: state.context.fetchWithPayment !== null,
    selectedStyle: state.context.selectedStyle,
    currentStyle: getStyleById(state.context.selectedStyle),
    uploadedImage: state.context.uploadedImage,
    generatedImage: state.context.generatedImage,
    generationId: state.context.generationId,
    error: state.context.error,
    nsfwScore: state.context.nsfwScore,
  };

  return <AvatarContext value={value}>{children}</AvatarContext>;
}

export function useAvatar() {
  const context = React.use(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
}
