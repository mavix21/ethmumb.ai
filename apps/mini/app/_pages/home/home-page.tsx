"use client";

import { Activity } from "react";

import { useAvatar } from "./model/avatar-context";
import { AnalyzingView } from "./ui/analyzing-view";
import { ConfirmationView } from "./ui/confirmation-view";
import { ErrorView } from "./ui/error-view";
import { IdleView } from "./ui/idle-view";
import { NsfwViolationView } from "./ui/nsfw-violation-view";
import { PaymentApprovalView } from "./ui/payment-approval-view";
import { ProcessingView } from "./ui/processing-view";
import { SuccessView } from "./ui/success-view";

export function HomePage() {
  const {
    isIdle,
    isAnalyzing,
    isNsfwViolation,
    isUserConfirming,
    // Generating substates
    isDiscovering,
    isAwaitingPayment,
    isExecutingGeneration,
    // Error states
    isServerError,
    isSuccess,
  } = useAvatar();

  // Show PaymentApprovalView during discovery and wallet signing phases
  const showPaymentApproval = isDiscovering || isAwaitingPayment;
  // Show ProcessingView only during actual generation
  const showProcessing = isExecutingGeneration;

  return (
    <>
      <Activity mode={isIdle ? "visible" : "hidden"}>
        <IdleView />
      </Activity>
      {isAnalyzing && <AnalyzingView />}
      {isNsfwViolation && <NsfwViolationView />}
      {isUserConfirming && <ConfirmationView />}
      {showPaymentApproval && <PaymentApprovalView />}
      {showProcessing && <ProcessingView />}
      {isServerError && <ErrorView />}
      {isSuccess && <SuccessView />}
    </>
  );
}
