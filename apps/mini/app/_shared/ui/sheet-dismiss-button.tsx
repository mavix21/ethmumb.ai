import { X } from "lucide-react";

import { Button } from "@myapp/ui/components/button";
import { LongSheet } from "@myapp/ui/components/long-sheet/index";

/**
 * Reusable dismiss button for LongSheet components.
 * Positioned in the top-right corner with consistent styling.
 */
export function SheetDismissButton() {
  return (
    <LongSheet.Trigger action="dismiss" asChild>
      <Button
        variant="secondary"
        size="icon"
        className="absolute! top-4 right-4 z-1 rounded-full"
      >
        <X className="text-muted-foreground size-6" />
        <span className="sr-only">Dismiss Sheet</span>
      </Button>
    </LongSheet.Trigger>
  );
}
