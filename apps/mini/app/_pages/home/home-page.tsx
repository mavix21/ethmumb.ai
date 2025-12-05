"use client";

import { useAvatar } from "./model/avatar-context";
import { IdleView } from "./ui/idle-view";

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

  return <>{isIdle && <IdleView />}</>;
}
