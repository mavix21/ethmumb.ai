import * as React from "react";
import { Loader2, Sparkles, Wallet } from "lucide-react";

import { cn } from "@ethmumb.ai/ui/lib/utils";

import { triggerHaptics } from "@/lib/farcaster/utils";
import { useMiniApp } from "@/shared/context/miniapp-context";

import { useAvatar } from "../model/avatar-context";

export function PaymentApprovalView() {
  const { context, capabilities } = useMiniApp();
  const { isDiscovering, isAwaitingPayment } = useAvatar();
  const [pulseCount, setPulseCount] = React.useState(0);

  // Haptic feedback when state changes
  React.useEffect(() => {
    if (isAwaitingPayment) {
      // Strong haptic when wallet approval is needed
      triggerHaptics(context, capabilities, "haptics.impactOccurred", "heavy");
    }
  }, [isAwaitingPayment, context, capabilities]);

  // Pulse animation for wallet icon
  React.useEffect(() => {
    if (!isAwaitingPayment) return;

    const pulseInterval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
      triggerHaptics(context, capabilities, "haptics.impactOccurred", "light");
    }, 2000);

    return () => clearInterval(pulseInterval);
  }, [isAwaitingPayment, context, capabilities]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Animated wallet icon */}
        <div className="relative">
          {/* Pulsing glow effect */}
          <div
            className={cn(
              "bg-brand-cream/20 absolute inset-0 -z-10 rounded-full blur-3xl transition-all duration-1000",
              pulseCount % 2 === 0
                ? "scale-100 opacity-50"
                : "scale-110 opacity-30",
            )}
          />

          {/* Wallet icon container */}
          <div
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-full border-4 shadow-2xl transition-all duration-500",
              isAwaitingPayment
                ? "border-brand-cream bg-brand-cream/10"
                : "border-white/50 bg-white/10",
            )}
          >
            {isDiscovering ? (
              <Loader2 className="text-brand-cream h-16 w-16 animate-spin" />
            ) : (
              <Wallet
                className={cn(
                  "h-16 w-16 transition-transform duration-500",
                  isAwaitingPayment && "text-brand-cream animate-pulse",
                  pulseCount % 2 === 0 ? "scale-100" : "scale-110",
                )}
              />
            )}
          </div>
        </div>

        {/* Header */}
        <div>
          {isDiscovering ? (
            <>
              <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
                Preparing Payment
              </h2>
              <p className="text-foreground/90 text-sm">
                Setting up your secure payment...
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
                Confirm in Wallet
              </h2>
              <p className="text-foreground/90 text-sm">
                Check your wallet to approve the 0.2 USDC payment
              </p>
            </>
          )}
        </div>

        {/* Status message */}
        <div className="h-8">
          {isDiscovering ? (
            <p className="text-foreground/80 flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to payment service...</span>
            </p>
          ) : (
            <p className="text-foreground/80 animate-fade-in flex items-center justify-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Waiting for your approval...</span>
            </p>
          )}
        </div>

        {/* Reassurance */}
        <div className="max-w-xs space-y-2">
          <p className="text-foreground/50 text-xs">
            {isAwaitingPayment
              ? "Your wallet will ask you to sign a payment message. This is secure and instant."
              : "This only takes a moment..."}
          </p>
          {isAwaitingPayment && (
            <p className="text-brand-cream/70 text-xs font-medium">
              💡 Don&apos;t see the prompt? Check your wallet app.
            </p>
          )}
        </div>
      </div>

      {/* Add fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}
