"use client";

import { LongSheet } from "@myapp/ui/components/long-sheet/index";

import { ArticleContent } from "@/pages/article/article-content";
import { useSheetRoute } from "@/shared/hooks/use-sheet-route";
import { SheetDismissButton } from "@/shared/ui/sheet-dismiss-button";

/**
 * Intercepting route for /article (soft navigation).
 */
export default function ArticleSheetIntercepted() {
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
