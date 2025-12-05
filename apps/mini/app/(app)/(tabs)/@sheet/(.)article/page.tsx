"use client";

import { Suspense } from "react";

import { LongSheet } from "@ethmumb.ai/ui/components/long-sheet/index";

import { ArticleContent } from "@/pages/article/article-content";
import { useSheetRoute } from "@/shared/hooks/use-sheet-route";
import { SheetDismissButton } from "@/shared/ui/sheet-dismiss-button";

function ArticleSheetContent() {
  const { presented, onPresentedChange, onTravelStatusChange } = useSheetRoute({
    route: "/article",
  });

  return (
    <LongSheet.Root presented={presented} onPresentedChange={onPresentedChange}>
      <LongSheet.Portal>
        <LongSheet.View
          onTravelStatusChange={onTravelStatusChange}
          onDismissAutoFocus={{ focus: false }}
        >
          <LongSheet.Backdrop />
          <LongSheet.Content>
            <ArticleContent dismissButton={<SheetDismissButton />} />
          </LongSheet.Content>
        </LongSheet.View>
      </LongSheet.Portal>
    </LongSheet.Root>
  );
}

/**
 * Intercepting route for /article (soft navigation).
 */
export default function ArticleSheetIntercepted() {
  return (
    <Suspense fallback={null}>
      <ArticleSheetContent />
    </Suspense>
  );
}
