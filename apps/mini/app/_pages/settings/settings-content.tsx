"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  ChevronRight,
  LogOut,
  Moon,
  Palette,
  Sun,
  User,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@myapp/ui/components/avatar";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import { Card, CardContent } from "@myapp/ui/components/card";
import { Skeleton } from "@myapp/ui/components/skeleton";

import { useAuth } from "@/app/_contexts/auth-context";
import { useAddMiniApp, useMiniApp } from "@/app/_contexts/miniapp-context";

interface SettingsContentProps {
  dismissButton?: React.ReactNode;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

function SettingsItem({
  icon,
  label,
  description,
  action,
  onClick,
  variant = "default",
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          variant === "destructive" ? "bg-destructive/10" : "bg-secondary"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium ${
            variant === "destructive" ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {action ??
        (onClick && <ChevronRight className="text-muted-foreground size-4" />)}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="hover:bg-accent/50 -mx-2 w-full rounded-lg px-2 text-left transition-colors active:scale-[0.99]"
      >
        {content}
      </button>
    );
  }

  return content;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 py-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

export function SettingsContent({ dismissButton }: SettingsContentProps) {
  const { context, isMiniAppReady, isInMiniApp, capabilities } = useMiniApp();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const addMiniApp = useAddMiniApp();

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const isLoading = isAuthLoading || (isInMiniApp && !isMiniAppReady);
  const farcasterUser = context?.user;
  const client = context?.client;
  const hasNotifications = !!client?.notificationDetails;

  const initials =
    farcasterUser?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ??
    farcasterUser?.username?.slice(0, 2).toUpperCase() ??
    "?";

  const handleEnableNotifications = async () => {
    await addMiniApp();
  };

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    if (nextTheme) {
      setTheme(nextTheme);
    }
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Palette;

  return (
    <div className="relative h-full">
      {dismissButton}

      <div className="px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          {/* Header */}
          <header className="space-y-1">
            <h1 className="text-foreground text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </header>

          {isLoading ? (
            <SettingsSkeleton />
          ) : (
            <>
              {/* Account Section */}
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                  Account
                </h2>
                <Card>
                  <CardContent className="py-2">
                    {isAuthenticated && farcasterUser ? (
                      <div className="flex items-center gap-3 py-3">
                        <Avatar className="ring-border size-12 ring-2">
                          <AvatarImage
                            src={farcasterUser.pfpUrl}
                            alt={
                              farcasterUser.displayName ??
                              farcasterUser.username ??
                              "User"
                            }
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate font-semibold">
                            {farcasterUser.displayName ?? "Anonymous"}
                          </p>
                          <p className="text-muted-foreground truncate text-sm">
                            {farcasterUser.username
                              ? `@${farcasterUser.username}`
                              : `FID #${farcasterUser.fid}`}
                          </p>
                        </div>
                        <Badge variant="secondary">Connected</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-3">
                        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                          <User className="text-muted-foreground size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">Guest</p>
                          <p className="text-muted-foreground text-sm">
                            Sign in for full features
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Preferences Section */}
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                  Preferences
                </h2>
                <Card>
                  <CardContent className="divide-border divide-y py-1">
                    <SettingsItem
                      icon={
                        <ThemeIcon className="text-muted-foreground size-4" />
                      }
                      label="Appearance"
                      description={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                      onClick={cycleTheme}
                    />

                    {isInMiniApp && (
                      <SettingsItem
                        icon={
                          hasNotifications ? (
                            <Bell className="text-muted-foreground size-4" />
                          ) : (
                            <BellOff className="text-muted-foreground size-4" />
                          )
                        }
                        label="Notifications"
                        description={
                          hasNotifications
                            ? "Enabled for this app"
                            : "Enable to receive updates"
                        }
                        action={
                          !hasNotifications ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleEnableNotifications}
                            >
                              Enable
                            </Button>
                          ) : (
                            <Badge variant="outline">On</Badge>
                          )
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* App Info Section */}
              <section className="space-y-3">
                <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                  App Info
                </h2>
                <Card className="bg-muted/30">
                  <CardContent className="py-3">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Version</dt>
                        <dd className="text-foreground font-mono">1.0.0</dd>
                      </div>
                      {isInMiniApp && (
                        <>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Platform</dt>
                            <dd className="text-foreground font-mono">
                              {client?.platformType ?? "unknown"}
                            </dd>
                          </div>
                          {capabilities && capabilities.length > 0 && (
                            <div className="pt-2">
                              <dt className="text-muted-foreground mb-2">
                                Capabilities
                              </dt>
                              <dd className="flex flex-wrap gap-1">
                                {capabilities.map((cap) => (
                                  <Badge
                                    key={cap}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {cap}
                                  </Badge>
                                ))}
                              </dd>
                            </div>
                          )}
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              </section>

              {/* Sign Out */}
              {isAuthenticated && (
                <section className="pt-2">
                  <Card className="border-destructive/30">
                    <CardContent className="py-1">
                      <SettingsItem
                        icon={<LogOut className="text-destructive size-4" />}
                        label="Sign Out"
                        description="You can sign back in anytime"
                        variant="destructive"
                        onClick={() => {
                          // TODO: Implement sign out
                          console.log("Sign out clicked");
                        }}
                      />
                    </CardContent>
                  </Card>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
