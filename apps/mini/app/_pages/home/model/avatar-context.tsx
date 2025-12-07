"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { createConfig, http } from "@wagmi/core";
import { base } from "@wagmi/core/chains";
import { useMachine } from "@xstate/react";
import { createClient } from "viem";
import { useAccount } from "wagmi";
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

// Max payment amount: $0.25 USDC (endpoint costs $0.20)
const MAX_PAYMENT_USDC = BigInt(0.25 * 10 ** 6);

// Create wagmi config for x402 - matching x402 mini-app template approach
const x402Config = createConfig({
  chains: [base],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { address, chainId, connector, isConnected } = useAccount();
  const [fetchWithPayment, setFetchWithPayment] =
    React.useState<FetchWithPayment | null>(null);

  // Create the x402-wrapped fetch when wallet is connected
  // Using getWalletClient with explicit connector for MiniKit/TBA compatibility
  React.useEffect(() => {
    async function setupPaymentFetch() {
      // LOG 1: Initial wallet state
      console.log("[x402-debug] 1. Wallet state:", {
        isConnected,
        address,
        chainId,
        connectorId: connector?.id,
        connectorName: connector?.name,
        connectorType: connector?.type,
      });

      if (!isConnected || !address || !chainId || !connector) {
        console.log("[x402-debug] 1a. Wallet not ready, skipping setup");
        setFetchWithPayment(null);
        return;
      }

      try {
        console.log("[x402-debug] 2. Getting wallet client...");
        const walletClient = await getWalletClient(x402Config, {
          account: address,
          chainId: chainId,
          connector: connector,
        });

        // LOG 2: WalletClient details - critical for understanding x402 compatibility
        console.log("[x402-debug] 3. WalletClient obtained:", {
          address: walletClient.account.address,
          chainId: walletClient.chain.id,
          chainName: walletClient.chain.name,
          hasSignTypedData: typeof walletClient.signTypedData === "function",
          hasSignMessage: typeof walletClient.signMessage === "function",
          walletClientKeys: Object.keys(walletClient),
        });

        const wrappedFetch = wrapFetchWithPayment(
          fetch,
          walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
          MAX_PAYMENT_USDC,
        );
        console.log(
          "[x402-debug] 4. wrapFetchWithPayment created successfully",
        );
        setFetchWithPayment(() => wrappedFetch);
      } catch (error) {
        console.error("[x402-debug] ERROR in setup:", error);
        setFetchWithPayment(null);
      }
    }

    void setupPaymentFetch();
  }, [address, chainId, connector, isConnected]);
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
