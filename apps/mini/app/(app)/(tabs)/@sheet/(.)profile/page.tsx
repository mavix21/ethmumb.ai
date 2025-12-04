"use client";

import { ProfilePageWithSettings } from "@/pages/profile/profile-page-with-settings";
import { useSheetRoute } from "@/shared/hooks/use-sheet-route";

/**
 * Intercepting route for /profile (soft navigation).
 * Settings is stacked on top using local state.
 */
export default function ProfileSheetIntercepted() {
  const { presented, onPresentedChange, onTravelStatusChange } = useSheetRoute({
    route: "/profile",
  });

  return (
    <ProfilePageWithSettings
      presented={presented}
      onPresentedChange={onPresentedChange}
      onTravelStatusChange={onTravelStatusChange}
    />
  );
}
