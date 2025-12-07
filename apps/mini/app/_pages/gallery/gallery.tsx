"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sdk as miniappSdk } from "@farcaster/miniapp-sdk";
import { useQuery } from "convex/react";
import { ExternalLink, ImageIcon, LogIn, Share2 } from "lucide-react";

import type { Doc } from "@ethmumb.ai/convex/_generated/dataModel";
import { api } from "@ethmumb.ai/convex/_generated/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ethmumb.ai/ui/components/avatar";
import { Badge } from "@ethmumb.ai/ui/components/badge";
import { Button } from "@ethmumb.ai/ui/components/button";
import { Card } from "@ethmumb.ai/ui/components/card-sheet/card-sheet";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ethmumb.ai/ui/components/empty";
import {
  LoadingButton,
  LoadingButtonContent,
} from "@ethmumb.ai/ui/components/loading-button";
import { Separator } from "@ethmumb.ai/ui/components/separator";
import { Skeleton } from "@ethmumb.ai/ui/components/skeleton";

import { useAuth } from "@/app/_contexts/auth-context";
import { env } from "@/env";
import { useMiniApp } from "@/shared/context/miniapp-context";

function GallerySkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Skeleton */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-5 w-32" />
          <Skeleton className="mx-auto h-3 w-24" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>

      {/* Gallery Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface GenerationCardProps {
  generation: Doc<"generations"> & { imageUrl: string | null };
}

function GenerationCard({ generation }: GenerationCardProps) {
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${env.SITE_URL}/generation/${generation._id}`;
    const result = await miniappSdk.actions.composeCast({
      text: "Check out my ETHMumbai avatar! 🚌✨ Created with the ETHMumbai Avatar Generator",
      embeds: [shareUrl],
    });
    console.log("Compose cast result:", result);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group focus-visible:ring-ring relative aspect-square overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2"
      >
        {generation.imageUrl ? (
          <Image
            src={generation.imageUrl}
            alt={`${generation.style} generation`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="bg-muted flex size-full items-center justify-center">
            <ImageIcon className="text-muted-foreground size-8" />
          </div>
        )}
      </button>

      <Card.Root presented={open} onPresentedChange={setOpen}>
        <Card.Portal>
          <Card.View>
            <Card.Backdrop />
            <Card.Content className="bg-background mx-4 max-w-sm overflow-hidden rounded-2xl">
              {/* Image */}
              {generation.imageUrl && (
                <div className="relative aspect-square w-full">
                  <Image
                    src={generation.imageUrl}
                    alt={`${generation.style} generation`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{generation.style}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleShare}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Share2 className="mr-2 size-4" />
                    Share
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/generation/${generation._id}` as "/"}>
                      <ExternalLink className="mr-2 size-4" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card.View>
        </Card.Portal>
      </Card.Root>
    </>
  );
}

function AuthenticatedGallery({ fid }: { fid: number }) {
  const generations = useQuery(api.generations.getByFid, { fid });

  if (generations === undefined) {
    return (
      <div className="space-y-4">
        <h3 className="text-foreground font-medium">All Generations</h3>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>No generations yet</EmptyTitle>
          <EmptyDescription>
            Create your first avatar to see it here!
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-foreground font-medium">All Generations</h3>
      <div className="grid grid-cols-2 gap-2">
        {generations.map((generation) => (
          <GenerationCard key={generation._id} generation={generation} />
        ))}
      </div>
    </div>
  );
}

function UnauthenticatedGallery() {
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImageIcon />
        </EmptyMedia>
        <EmptyTitle>Sign in to view your gallery</EmptyTitle>
        <EmptyDescription>
          Sign in to see all your previous avatar generations and manage your
          collection.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LoadingButton
          onClick={handleSignIn}
          isLoading={isSigningIn}
          className="w-full max-w-md"
        >
          <LoadingButtonContent loadingText="Signing in...">
            <LogIn className="size-4" />
            Sign In
          </LoadingButtonContent>
        </LoadingButton>
      </EmptyContent>
    </Empty>
  );
}

export function GalleryPage() {
  const { context, isMiniAppReady, isInMiniApp } = useMiniApp();
  const { isAuthenticated } = useAuth();

  const isMiniAppLoading = isInMiniApp && !isMiniAppReady;
  const user = context?.user;

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ??
    user?.username?.slice(0, 2).toUpperCase() ??
    "?";

  if (isMiniAppLoading) {
    return (
      <div className="relative h-full">
        <div className="px-4 py-8">
          <div className="mx-auto max-w-md">
            <GallerySkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-8">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-6">
          {/* User Profile Section - Always visible from MiniApp context */}
          {user && (
            <>
              <section className="flex flex-col items-center gap-3 py-4">
                <Avatar className="ring-border size-20 shadow-lg ring-4">
                  <AvatarImage
                    src={user.pfpUrl}
                    alt={user.displayName ?? user.username ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-foreground text-lg font-semibold">
                      {user.displayName ?? user.username ?? "Anonymous"}
                    </h2>
                    <Badge variant="secondary" className="size-5 p-0">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-3"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {user.username ? `@${user.username}` : ""}
                  </p>
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Gallery Section - Requires authentication */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {isAuthenticated && user?.fid ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <AuthenticatedGallery fid={user.fid} />
              </div>
            ) : (
              <UnauthenticatedGallery />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
