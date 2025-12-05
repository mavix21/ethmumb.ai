"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { useMachine } from "@xstate/react";

import type {
  AvatarError,
  AvatarEvent,
  StyleId,
} from "../_model/avatar-machine";
import { avatarMachine } from "../_model/avatar-machine";

interface AvatarContextValue {
  state: ReturnType<typeof useMachine<typeof avatarMachine>>[0];
  send: (event: AvatarEvent) => void;
  // Convenience helpers
  isIdle: boolean;
  isAnalyzing: boolean;
  isNsfwViolation: boolean;
  isUserConfirming: boolean;
  isPaying: boolean;
  isProcessing: boolean;
  isServerError: boolean;
  isSuccess: boolean;
  selectedStyle: StyleId;
  uploadedImage: string | null;
  generatedImage: string | null;
  error: AvatarError | null;
  nsfwScore: number | null;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [state, send] = useMachine(avatarMachine);

  const value: AvatarContextValue = {
    state,
    send,
    isIdle: state.matches("idle"),
    isAnalyzing: state.matches("analyzing"),
    isNsfwViolation: state.matches("nsfw_violation"),
    isUserConfirming: state.matches("user_confirming"),
    isPaying: state.matches("paying"),
    isProcessing: state.matches("processing"),
    isServerError: state.matches("error"),
    isSuccess: state.matches("success"),
    selectedStyle: state.context.selectedStyle,
    uploadedImage: state.context.uploadedImage,
    generatedImage: state.context.generatedImage,
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
