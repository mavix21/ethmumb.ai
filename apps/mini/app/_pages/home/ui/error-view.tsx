import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";

import { useAvatar } from "../model/avatar-context";

export function ErrorView() {
  const { send, error } = useAvatar();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-card flex h-20 w-20 items-center justify-center rounded-full shadow-xl md:h-24 md:w-24">
          <AlertTriangle className="text-bus-yellow h-10 w-10 md:h-12 md:w-12" />
        </div>

        <div>
          <h2 className="font-display text-foreground mb-2 text-xl font-bold md:text-2xl">
            Processing Failed
          </h2>
          <p className="text-foreground/70 mb-4 text-sm">
            {error
              ? error.message
              : "An unexpected error occurred while processing your image."}
          </p>
          <p className="text-foreground/60 text-xs">
            This can happen occasionally. Please try again with the same or a
            different image.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => send({ type: "RETRY" })}>
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button
            onClick={() => send({ type: "START_OVER" })}
            variant="outline"
            className="border-foreground/30 text-foreground hover:border-foreground/60 gap-2 rounded-full border-2 bg-transparent"
          >
            Start Over
          </Button>
        </div>
      </div>
    </main>
  );
}
