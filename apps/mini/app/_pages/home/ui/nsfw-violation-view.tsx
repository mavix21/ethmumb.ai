import { RotateCcw, ShieldAlert } from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";

import { useAvatar } from "../model/avatar-context";

export function NsfwViolationView() {
  const { send } = useAvatar();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-card flex h-20 w-20 items-center justify-center rounded-full shadow-xl md:h-24 md:w-24">
          <ShieldAlert className="text-best-red h-10 w-10 md:h-12 md:w-12" />
        </div>

        <div>
          <h2 className="font-display text-foreground mb-2 text-xl font-bold md:text-2xl">
            Content Rejected
          </h2>
          <p className="text-foreground/70 mb-4 text-sm">
            This image violates our safety policy and cannot be processed.
          </p>
          <p className="text-foreground/60 text-xs">
            Please upload a different image that complies with our community
            guidelines.
          </p>
        </div>

        <Button onClick={() => send({ type: "RESET" })}>
          <RotateCcw className="size-4" />
          Try Another Image
        </Button>
      </div>
    </main>
  );
}
