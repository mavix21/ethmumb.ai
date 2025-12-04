"use client";

import { BottomSheet } from "@myapp/ui/components/bottom-sheet/index";

import { SettingsContent } from "@/pages/settings/settings-content";
import { useSheetPage } from "@/shared/hooks/use-sheet-page";

/**
 * Hard navigation route for /settings.
 * Uses defaultPresented to animate in, navigates to "/" on dismiss.
 */
export default function SettingsSheetDirect() {
  const sheetPage = useSheetPage("/");

  return (
    <BottomSheet.Root defaultPresented={true}>
      <BottomSheet.Portal>
        <BottomSheet.View
          onTravelStatusChange={sheetPage.onTravelStatusChange}
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
