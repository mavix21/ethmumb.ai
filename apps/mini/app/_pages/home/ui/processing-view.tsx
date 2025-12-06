import { Sparkles } from "lucide-react";

import { useAvatar } from "../model/avatar-context";

export function ProcessingView() {
  const { currentStyle } = useAvatar();

  const messages = [
    "Traveling to Mumbai...",
    "Finding the perfect BEST bus...",
    "Capturing the Gateway vibes...",
    "Adding Mumbai magic...",
    "Almost there...",
  ];

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex max-w-md flex-col items-center gap-6 text-center">
        {/* Animated loader */}
        <div className="relative">
          <div className="border-foreground/20 h-24 w-24 rounded-full border-4" />
          <div className="border-brand-cream absolute inset-0 h-24 w-24 animate-spin rounded-full border-4 border-t-transparent" />
          <Sparkles className="text-brand-cream absolute inset-0 m-auto h-8 w-8" />
        </div>

        <div>
          <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
            Creating Your Avatar
          </h2>
          <p className="text-foreground/70">
            Generating your{" "}
            <span className="text-brand-cream font-medium">
              {currentStyle.name}
            </span>{" "}
            style avatar...
          </p>
        </div>

        {/* Animated progress messages */}
        <div className="h-6 overflow-hidden">
          <div className="text-foreground/60 animate-pulse text-sm">
            {messages[Math.floor(Date.now() / 2000) % messages.length]}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-foreground/20 h-2 w-full max-w-xs overflow-hidden rounded-full">
          <div
            className="bg-brand-cream h-full animate-pulse rounded-full"
            style={{
              width: "60%",
              animation:
                "pulse 1.5s ease-in-out infinite, grow 3s ease-out forwards",
            }}
          />
        </div>
      </div>
    </main>
  );
}
