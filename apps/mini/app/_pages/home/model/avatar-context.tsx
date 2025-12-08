"use client";

import type { ReactNode } from "react";
import type { Signer } from "x402/types";
import * as React from "react";
import { useMachine } from "@xstate/react";
import { publicActions } from "viem";
import { useAccount, useConfig } from "wagmi";
import { getWalletClient } from "wagmi/actions";

import type { AvatarError, AvatarEvent, StyleId } from "./avatar-machine";
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
  // Generating phase substates
  isGenerating: boolean;
  isDiscovering: boolean;
  isAwaitingPayment: boolean;
  isExecutingGeneration: boolean;
  // Error states
  isServerError: boolean;
  isDiscoveryError: boolean;
  isPaymentError: boolean;
  isGenerationError: boolean;
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

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { address, chainId, connector, isConnected } = useAccount();
  // Use the SAME wagmi config that OnchainKit/MiniKit provides - this is critical!
  const wagmiConfig = useConfig();
  const [walletClient, setWalletClient] = React.useState<Signer | null>(null);

  // Get wallet client when wallet is connected
  // Using getWalletClient with the app's wagmi config for MiniKit/TBA compatibility
  React.useEffect(() => {
    async function setupWalletClient() {
      if (!isConnected || !address || !chainId || !connector) {
        setWalletClient(null);
        return;
      }

      try {
        // Use the same wagmi config from OnchainKit - NOT a separate config
        const client = await getWalletClient(wagmiConfig, {
          account: address,
          chainId: chainId,
          connector: connector,
        });

        // Extend wallet client with public actions to match x402's SignerWallet type
        // x402 requires Client with both PublicActions and WalletActions
        const extendedClient = client.extend(publicActions);
        setWalletClient(extendedClient);
      } catch {
        console.error("Failed to get wallet client");
        setWalletClient(null);
      }
    }

    void setupWalletClient();
  }, [address, chainId, connector, isConnected, wagmiConfig]);

  const [state, send] = useMachine(avatarMachine, {
    input: {
      walletClient,
      walletAddress: address ?? null,
    },
  });

  // Sync wallet connection state with machine
  React.useEffect(() => {
    if (walletClient && address) {
      send({ type: "WALLET_CONNECTED", walletClient, walletAddress: address });
    } else {
      send({ type: "WALLET_DISCONNECTED" });
    }
  }, [walletClient, address, send]);

  const value: AvatarContextValue = {
    state,
    send,
    isIdle: state.matches("idle"),
    isAnalyzing: state.matches("analyzing"),
    isNsfwViolation: state.matches("nsfw_violation"),
    isNsfwModelLoading: state.context.isModelLoading,
    isUserConfirming: state.matches("user_confirming"),
    // Generating phase - overall and substates
    isGenerating: state.matches("generating"),
    isDiscovering: state.matches({ generating: "discovering" }),
    isAwaitingPayment: state.matches({ generating: "awaitingPayment" }),
    isExecutingGeneration: state.matches({ generating: "executing" }),
    // Error states - overall and specific phases
    isServerError: state.matches("error"),
    isDiscoveryError: state.matches({ error: "discovery" }),
    isPaymentError: state.matches({ error: "payment" }),
    isGenerationError: state.matches({ error: "generation" }),
    isSuccess: state.matches("success"),
    isWalletConnected: state.context.walletClient !== null,
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
