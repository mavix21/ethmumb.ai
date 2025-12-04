"use client";

import type { TravelStatus } from "@silk-hq/components";
import { useState } from "react";
import { Settings } from "lucide-react";

import { Button } from "@myapp/ui/components/button";
import { Page } from "@myapp/ui/components/page/index";

import { ProfileContent } from "@/pages/profile/profile-content";

interface ProfilePageWithSettingsProps {
  /** For soft navigation (controlled) */
  presented?: boolean;
  onPresentedChange?: (presented: boolean) => void;
  /** For hard navigation (uncontrolled) */
  defaultPresented?: boolean;
  onTravelStatusChange: (status: TravelStatus) => void;
}

/**
 * Profile page with stacked settings sheet.
 * Settings is shown/hidden on top of the profile page using local state.
 */
export function ProfilePageWithSettings({
  presented,
  onPresentedChange,
  defaultPresented,
  onTravelStatusChange,
}: ProfilePageWithSettingsProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = presented !== undefined;

  return (
    <>
      {/* Profile Page */}
      <Page.Root
        {...(isControlled
          ? { presented, onPresentedChange }
          : { defaultPresented })}
      >
        <Page.Portal>
          <Page.View
            onTravelStatusChange={onTravelStatusChange}
            onDismissAutoFocus={{ focus: false }}
          >
            <Page.Backdrop />
            <Page.Content>
              <Page.Header
                title="Profile"
                subtitle="Your Farcaster account"
                backButton={{ mode: "dismiss" }}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="size-5" />
                  </Button>
                }
              />
              <ProfileContent />
            </Page.Content>
          </Page.View>
        </Page.Portal>
      </Page.Root>

      {/* Settings Page - stacked on top */}
      <Page.Root
        presented={showSettings}
        onPresentedChange={(value) => setShowSettings(value)}
      >
        <Page.Portal>
          <Page.View onDismissAutoFocus={{ focus: false }}>
            <Page.Backdrop />
            <Page.Content>
              <Page.Header
                title="Profile Settings"
                subtitle="Customize your profile"
                backButton={{ mode: "dismiss" }}
              />
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <span>Display Name</span>
                    <span className="text-muted-foreground">Edit</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <span>Bio</span>
                    <span className="text-muted-foreground">Edit</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <span>Profile Picture</span>
                    <span className="text-muted-foreground">Change</span>
                  </div>
                </div>
              </div>
            </Page.Content>
          </Page.View>
        </Page.Portal>
      </Page.Root>
    </>
  );
}
