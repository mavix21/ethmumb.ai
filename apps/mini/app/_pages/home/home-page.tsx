"use client";

import { Activity } from "react";

import { useAvatar } from "./model/avatar-context";
import { AnalyzingView } from "./ui/analyzing-view";
import { ConfirmationView } from "./ui/confirmation-view";
import { ErrorView } from "./ui/error-view";
import { IdleView } from "./ui/idle-view";
import { NsfwViolationView } from "./ui/nsfw-violation-view";
import { ProcessingView } from "./ui/processing-view";
import { SuccessView } from "./ui/success-view";

export function HomePage() {
  const {
    isIdle,
    isAnalyzing,
    isNsfwViolation,
    isUserConfirming,
    isPaying,
    isProcessing,
    isServerError,
    isSuccess,
  } = useAvatar();

  return (
    <>
      <Activity mode={isIdle ? "visible" : "hidden"}>
        <IdleView />
      </Activity>
      {isAnalyzing && <AnalyzingView />}
      {isNsfwViolation && <NsfwViolationView />}
      {(isUserConfirming || isPaying) && <ConfirmationView />}
      {isProcessing && <ProcessingView />}
      {isServerError && <ErrorView />}
      {isSuccess && <SuccessView />}
    </>
  );
}
