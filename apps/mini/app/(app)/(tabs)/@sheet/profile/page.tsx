"use client";

import { ProfilePageWithSettings } from "@/pages/profile/profile-page-with-settings";
import { useSheetPage } from "@/shared/hooks/use-sheet-page";

/**
 * Hard navigation route for /profile.
 * Settings is stacked on top using local state.
 */
export default function ProfileSheetDirect() {
  const sheetPage = useSheetPage("/");

  return (
    <ProfilePageWithSettings
      defaultPresented={true}
      onTravelStatusChange={sheetPage.onTravelStatusChange}
    />
  );
}
