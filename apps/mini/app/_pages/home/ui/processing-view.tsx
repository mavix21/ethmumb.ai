import * as React from "react";
import Image from "next/image";

import { cn } from "@ethmumb.ai/ui/lib/utils";

import { triggerHaptics } from "@/lib/farcaster/utils";
import { useMiniApp } from "@/shared/context/miniapp-context";

// Psychologically crafted messages - builds anticipation and emotional connection
const MESSAGES = [
  { text: "Confirm the payment in your wallet...", emoji: "💳" },
  { text: "Boarding the BEST bus to Mumbai...", emoji: "🚌" },
  { text: "Passing through the Gateway of India...", emoji: "🏛️" },
  { text: "Capturing the spirit of the city...", emoji: "✨" },
  { text: "Infusing Mumbai magic into every pixel...", emoji: "🎨" },
  { text: "This is going to look amazing...", emoji: "🔥" },
  { text: "Almost there, hang tight...", emoji: "⏳" },
  { text: "Adding the finishing touches...", emoji: "💫" },
  { text: "Your avatar is taking shape...", emoji: "🖼️" },
] as const;

export function ProcessingView() {
  const { context, capabilities } = useMiniApp();
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [pulseCount, setPulseCount] = React.useState(0);

  // Rotate messages with haptic feedback
  React.useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
      triggerHaptics(context, capabilities, "haptics.impactOccurred", "light");
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [context, capabilities]);

  // Progress animation with "minting kicks"
  React.useEffect(() => {
    // Simulate progress with random jumps (feels more organic)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until actually done
        const jump = Math.random() * 8 + 2; // 2-10% jumps
        return Math.min(prev + jump, 95);
      });
    }, 800);

    return () => clearInterval(progressInterval);
  }, []);

  // Haptic "minting kicks" at intervals - feels like something is being forged
  React.useEffect(() => {
    const hapticPattern = [
      { delay: 2000, intensity: "medium" as const },
      { delay: 3500, intensity: "heavy" as const },
      { delay: 5000, intensity: "light" as const },
      { delay: 7000, intensity: "heavy" as const },
      { delay: 9000, intensity: "medium" as const },
      { delay: 11000, intensity: "heavy" as const },
    ];

    const timeouts = hapticPattern.map(({ delay, intensity }) =>
      setTimeout(() => {
        triggerHaptics(
          context,
          capabilities,
          "haptics.impactOccurred",
          intensity,
        );
        setPulseCount((prev) => prev + 1);
      }, delay),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [context, capabilities]);

  const currentMessage = MESSAGES[messageIndex] ?? MESSAGES[0];

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Morphing image preview */}
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

          {/* Minting GIF container */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-white/50 shadow-2xl">
            <div className="relative h-56 w-56">
              <Image
                src="/india-bus.gif"
                alt="Minting your avatar..."
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* GIF attribution */}
          <p className="text-foreground/70 mt-2 text-center text-[10px]">
            Art by Dippyaman Nath, Kolkata 🇮🇳
          </p>
        </div>

        {/* Header */}
        <div>
          <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
            Creating Your Avatar
          </h2>
          <p className="text-foreground/60 text-sm">
            Something special is being crafted just for you
          </p>
        </div>

        {/* Animated message */}
        <div className="h-8">
          <p
            key={messageIndex}
            className="text-foreground/80 animate-fade-in flex items-center justify-center gap-2 text-sm"
          >
            <span>{currentMessage.emoji}</span>
            <span>{currentMessage.text}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="bg-foreground/10 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand-cream h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-foreground/40 mt-2 text-xs">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Reassurance */}
        <p className="text-foreground/40 max-w-xs text-xs">
          This usually takes 10-20 seconds. Your avatar will be worth the wait!
        </p>
      </div>

      {/* Add shimmer animation to global styles */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
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
