"use client";

import {
  AtSign,
  ExternalLink,
  Hash,
  MapPin,
  Shield,
  Smartphone,
  User,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ethmumb.ai/ui/components/avatar";
import { Badge } from "@ethmumb.ai/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ethmumb.ai/ui/components/card";
import { Separator } from "@ethmumb.ai/ui/components/separator";
import { Skeleton } from "@ethmumb.ai/ui/components/skeleton";

import { useMiniApp } from "@/shared/context/miniapp-context";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-24 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mx-auto h-4 w-28" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
  mono?: boolean;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-md">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={`text-foreground truncate text-sm ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function ProfileContent() {
  const { context, isMiniAppReady, isInMiniApp } = useMiniApp();

  const isLoading = isInMiniApp && !isMiniAppReady;
  const user = context?.user;
  const client = context?.client;
  const location = context?.location;

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ??
    user?.username?.slice(0, 2).toUpperCase() ??
    "?";

  return (
    <div className="relative h-full">
      <div className="px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          {isLoading ? (
            <ProfileSkeleton />
          ) : user ? (
            <>
              {/* User Avatar & Name */}
              <section className="flex flex-col items-center gap-4 py-4">
                <Avatar className="ring-border size-24 shadow-lg ring-4">
                  <AvatarImage
                    src={user.pfpUrl}
                    alt={user.displayName ?? user.username ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 text-center">
                  <h2 className="text-foreground text-xl font-semibold">
                    {user.displayName ?? "Anonymous"}
                  </h2>
                  {user.username && (
                    <p className="text-muted-foreground">@{user.username}</p>
                  )}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Badge variant="secondary" className="font-mono">
                      FID #{user.fid}
                    </Badge>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Account Details */}
              <section className="space-y-1">
                <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
                  Account Details
                </h3>
                <Card>
                  <CardContent className="divide-border divide-y py-2">
                    <InfoRow
                      icon={<Hash className="text-muted-foreground size-4" />}
                      label="Farcaster ID"
                      value={user.fid}
                      mono
                    />
                    <InfoRow
                      icon={<AtSign className="text-muted-foreground size-4" />}
                      label="Username"
                      value={user.username ? `@${user.username}` : undefined}
                    />
                    <InfoRow
                      icon={<User className="text-muted-foreground size-4" />}
                      label="Display Name"
                      value={user.displayName}
                    />
                    {user.location && (
                      <InfoRow
                        icon={
                          <MapPin className="text-muted-foreground size-4" />
                        }
                        label="Location"
                        value={user.location.description}
                      />
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Client Information */}
              {client && (
                <section className="space-y-1">
                  <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
                    Client Information
                  </h3>
                  <Card>
                    <CardContent className="divide-border divide-y py-2">
                      <InfoRow
                        icon={
                          <Smartphone className="text-muted-foreground size-4" />
                        }
                        label="Platform"
                        value={client.platformType ?? "Unknown"}
                      />
                      <InfoRow
                        icon={<Hash className="text-muted-foreground size-4" />}
                        label="Client FID"
                        value={client.clientFid}
                        mono
                      />
                      <div className="flex items-center gap-3 py-2">
                        <div className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-md">
                          <Shield className="text-muted-foreground size-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-muted-foreground text-xs">
                            App Status
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge
                              variant={client.added ? "default" : "secondary"}
                            >
                              {client.added ? "Added" : "Not Added"}
                            </Badge>
                            {client.notificationDetails && (
                              <Badge variant="outline">Notifications On</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Location Context */}
              {location && (
                <section className="space-y-1">
                  <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
                    Launch Context
                  </h3>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">
                        {location.type.replace("_", " ")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        How this mini app was opened
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {location.type === "cast_embed" && (
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            Embedded in a cast by{" "}
                            <span className="text-foreground font-medium">
                              @{location.cast.author.username}
                            </span>
                          </p>
                          {location.cast.text && (
                            <p className="text-foreground bg-background rounded-md p-2 text-xs">
                              "{location.cast.text.slice(0, 100)}
                              {location.cast.text.length > 100 ? "..." : ""}"
                            </p>
                          )}
                        </div>
                      )}
                      {location.type === "notification" && (
                        <div className="space-y-1">
                          <p className="text-foreground font-medium">
                            {location.notification.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {location.notification.body}
                          </p>
                        </div>
                      )}
                      {location.type === "channel" && (
                        <div className="flex items-center gap-2">
                          {location.channel.imageUrl && (
                            <Avatar className="size-8">
                              <AvatarImage src={location.channel.imageUrl} />
                              <AvatarFallback>
                                {location.channel.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="text-foreground font-medium">
                              /{location.channel.key}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {location.channel.name}
                            </p>
                          </div>
                        </div>
                      )}
                      {location.type === "launcher" && (
                        <p className="text-muted-foreground">
                          Opened from the Farcaster launcher
                        </p>
                      )}
                      {location.type === "open_miniapp" && (
                        <p className="text-muted-foreground">
                          Referred from{" "}
                          <span className="text-foreground font-mono">
                            {location.referrerDomain}
                          </span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* View on Warpcast */}
              {user.username && (
                <section className="pt-2">
                  <a
                    href={`https://warpcast.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 transition-colors active:scale-[0.98]"
                  >
                    <span className="font-medium">View on Warpcast</span>
                    <ExternalLink className="size-4" />
                  </a>
                </section>
              )}
            </>
          ) : (
            /* No user context - show placeholder */
            <Card className="bg-muted/30">
              <CardContent className="py-8 text-center">
                <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  <User className="text-muted-foreground size-8" />
                </div>
                <h3 className="text-foreground mb-1 font-semibold">
                  No Profile Available
                </h3>
                <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                  Profile information is only available when running inside a
                  Farcaster client.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
