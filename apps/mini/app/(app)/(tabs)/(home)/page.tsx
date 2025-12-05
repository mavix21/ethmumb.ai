"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Layers,
  Settings,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ethmumb.ai/ui/components/avatar";
import { Button } from "@ethmumb.ai/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ethmumb.ai/ui/components/card";
import { CardSheet } from "@ethmumb.ai/ui/components/card-sheet/index";
import { Skeleton } from "@ethmumb.ai/ui/components/skeleton";

import { useAuth } from "@/app/_contexts/auth-context";
import { useMiniApp } from "@/shared/context/miniapp-context";

interface FeatureDetails {
  icon: React.ReactNode;
  title: string;
  description: string;
  longDescription: string;
}

const features: FeatureDetails[] = [
  {
    icon: <Sparkles className="text-primary size-4" />,
    title: "Silk Components",
    description: "Beautiful sheet transitions and gestures",
    longDescription:
      "Silk Components provides a collection of beautifully animated sheet components with native-like gestures. It includes smooth transitions, spring animations, and touch-friendly interactions that make your app feel polished and professional. Perfect for creating modal dialogs, bottom sheets, and card overlays.",
  },
  {
    icon: <Zap className="text-primary size-4" />,
    title: "Farcaster SDK",
    description: "User context, auth, and notifications",
    longDescription:
      "The Farcaster SDK enables seamless integration with the Farcaster protocol. Access user profiles, authenticate users with their Farcaster identity, send notifications, and leverage the social graph. Build social features that connect with the Farcaster ecosystem effortlessly.",
  },
  {
    icon: <Layers className="text-primary size-4" />,
    title: "OnchainKit",
    description: "Wallet connection and transactions",
    longDescription:
      "OnchainKit by Coinbase simplifies blockchain interactions in your app. It provides ready-to-use components for wallet connection, transaction signing, and on-chain data fetching. Support multiple wallets and chains with minimal configuration and a great developer experience.",
  },
];

function UserCard() {
  const { context, isMiniAppReady, isInMiniApp } = useMiniApp();
  const { isAuthenticated, isLoading, signIn } = useAuth();

  // Loading state
  if (isLoading || (isInMiniApp && !isMiniAppReady)) {
    return (
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="flex items-center gap-4 px-0">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Authenticated user with Farcaster context
  if (isAuthenticated && context?.user) {
    const { user } = context;
    const initials =
      user.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ??
      user.username?.slice(0, 2).toUpperCase() ??
      "?";

    return (
      <Link href="/profile" className="block">
        <Card className="hover:bg-accent/50 border-none bg-transparent shadow-none transition-colors active:scale-[0.98]">
          <CardContent className="flex items-center gap-4 px-0">
            <Avatar className="ring-border size-14 ring-2">
              <AvatarImage
                src={user.pfpUrl}
                alt={user.displayName ?? user.username ?? "User"}
              />
              <AvatarFallback className="text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-semibold">
                {user.displayName ?? user.username ?? "Anonymous"}
              </p>
              {user.username && (
                <p className="text-muted-foreground truncate text-sm">
                  @{user.username}
                </p>
              )}
            </div>
            <ChevronRight className="text-muted-foreground size-5 shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Guest state - prompt to sign in
  return (
    <Card className="border shadow-none">
      <CardContent className="flex items-center gap-4">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <User className="text-muted-foreground size-6" />
        </div>
        <div className="flex-1">
          <p className="text-foreground font-semibold">Welcome, Guest</p>
          <p className="text-muted-foreground text-sm">
            Sign in to get started
          </p>
        </div>
        <Button onClick={signIn}>Sign In</Button>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  href: Route;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

function QuickAction({ href, icon, label, description }: QuickActionProps) {
  return (
    <Link href={href} className="block" scroll={false}>
      <Card className="hover:bg-accent/50 hover:border-accent h-full transition-all active:scale-[0.98]">
        <CardContent className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-medium">{label}</p>
            {description && (
              <p className="text-muted-foreground truncate text-xs">
                {description}
              </p>
            )}
          </div>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

function FeatureCard({ feature }: { feature: FeatureDetails }) {
  return (
    <CardSheet.Root>
      <CardSheet.Trigger asChild>
        <button className="hover:bg-accent/50 flex w-full cursor-pointer gap-3 rounded-xl px-2 py-1 text-left transition-colors active:scale-[0.98]">
          <div className="bg-secondary flex size-8 shrink-0 items-center justify-center rounded-lg">
            {feature.icon}
          </div>
          <div className="flex-1">
            <p className="text-foreground text-sm font-medium">
              {feature.title}
            </p>
            <p className="text-muted-foreground text-xs">
              {feature.description}
            </p>
          </div>
          <ChevronRight className="text-muted-foreground size-4 shrink-0 self-center" />
        </button>
      </CardSheet.Trigger>
      <CardSheet.Portal>
        <CardSheet.View>
          <CardSheet.Backdrop />
          <CardSheet.Content className="space-y-6 border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
                {feature.icon}
              </div>
              <CardSheet.Title className="text-foreground text-lg font-semibold">
                {feature.title}
              </CardSheet.Title>
            </div>
            <CardSheet.Description className="text-muted-foreground text-sm leading-relaxed">
              {feature.longDescription}
            </CardSheet.Description>
          </CardSheet.Content>
        </CardSheet.View>
      </CardSheet.Portal>
    </CardSheet.Root>
  );
}

export default function Home() {
  const { error, clearError } = useAuth();
  const { context, isInMiniApp } = useMiniApp();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-border/50 flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-2">
          <Image
            priority
            src="/ethmumbai.png"
            alt="App Logo"
            width={105}
            height={36}
            className="shrink-0"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 px-4 py-6">
        {/* Error Banner */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertCircle className="text-destructive size-5 shrink-0" />
              <p className="text-destructive flex-1 text-sm">{error.message}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* User Section */}
        <section>
          <UserCard />
        </section>

        {/* Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            <QuickAction
              href="/profile"
              icon={<User className="text-primary size-5" />}
              label="View Profile"
              description="See your Farcaster profile"
            />
            <QuickAction
              href="/settings"
              icon={<Settings className="text-primary size-5" />}
              label="Settings"
              description="Manage app preferences"
            />
          </div>
        </section>

        {/* Features Showcase */}
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Template Features
          </h2>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Built for Farcaster</CardTitle>
              <CardDescription>
                This template showcases key integrations for building mini apps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Context Debug (only in mini app) */}
        {isInMiniApp && context && (
          <section className="space-y-3">
            <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Mini App Context
            </h2>
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Platform</dt>
                  <dd className="text-foreground font-mono">
                    {context.client.platformType ?? "unknown"}
                  </dd>

                  <dt className="text-muted-foreground">Client FID</dt>
                  <dd className="text-foreground font-mono">
                    {context.client.clientFid}
                  </dd>

                  <dt className="text-muted-foreground">User FID</dt>
                  <dd className="text-foreground font-mono">
                    {context.user.fid}
                  </dd>

                  <dt className="text-muted-foreground">Added to Client</dt>
                  <dd className="text-foreground font-mono">
                    {context.client.added ? "Yes" : "No"}
                  </dd>

                  {context.location && (
                    <>
                      <dt className="text-muted-foreground">Location Type</dt>
                      <dd className="text-foreground font-mono">
                        {context.location.type}
                      </dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-border/50 shrink-0 border-t px-4 py-4">
        <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
          <span>Built with</span>
          <a
            href="https://github.com/mavix21/nextjs-monorepo-onchain"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            nextjs-monorepo-onchain
            <ExternalLink className="size-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
