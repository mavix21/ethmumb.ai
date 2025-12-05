"use client";

import { Suspense } from "react";

import { BottomSheet } from "@ethmumb.ai/ui/components/bottom-sheet/index";

import { SettingsContent } from "@/pages/settings/settings-content";
import { useSheetRoute } from "@/shared/hooks/use-sheet-route";

function SettingsSheetContent() {
  const { presented, onPresentedChange, onTravelStatusChange } = useSheetRoute({
    route: "/settings",
  });

  return (
    <BottomSheet.Root
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <BottomSheet.Portal>
        <BottomSheet.View
          onTravelStatusChange={onTravelStatusChange}
          onDismissAutoFocus={{ focus: false }}
        >
          <BottomSheet.Backdrop />
          <BottomSheet.Content className="grid">
            <BottomSheet.Handle
              className="mt-2 self-center justify-self-center"
              style={{
                gridArea: "1 / -1",
              }}
            />
            <SettingsContent />
          </BottomSheet.Content>
        </BottomSheet.View>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

/**
 * Intercepting route for /settings.
 * Shows settings as a bottom sheet on soft navigation.
 */
export default function SettingsSheetIntercepted() {
  return (
    <Suspense fallback={null}>
      <SettingsSheetContent />
    </Suspense>
  );
}
