"use client";

import { Suspense } from "react";

import { ProfilePageWithSettings } from "@/pages/profile/profile-page-with-settings";
import { useSheetRoute } from "@/shared/hooks/use-sheet-route";

function ProfileSheetContent() {
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

/**
 * Intercepting route for /profile (soft navigation).
 * Settings is stacked on top using local state.
 */
export default function ProfileSheetIntercepted() {
  return (
    <Suspense fallback={null}>
      <ProfileSheetContent />
    </Suspense>
  );
}
