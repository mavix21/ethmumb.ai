"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { useMachine } from "@xstate/react";
import { publicActions } from "viem";
import { useWalletClient } from "wagmi";
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

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();

  // Create the x402-wrapped fetch when wallet client is available
  // Extend wallet client with public actions to match x402 Signer type
  const fetchWithPayment = React.useMemo<FetchWithPayment | null>(() => {
    if (!walletClient) return null;
    const signer = walletClient.extend(publicActions);
    return wrapFetchWithPayment(fetch, signer, MAX_PAYMENT_USDC);
  }, [walletClient]);

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
