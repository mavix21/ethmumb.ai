"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Sparkles } from "lucide-react";

import type { Doc } from "@ethmumb.ai/convex/_generated/dataModel";
import { Button } from "@ethmumb.ai/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ethmumb.ai/ui/components/empty";
import { Badge } from "@ethmumb.ai/ui/components/badge";

type Generation = Doc<"generations"> & { imageUrl: string | null };

interface GenerationContentProps {
  generation: Generation | null;
}

const styleLabels: Record<Generation["style"], string> = {
  "classic-best": "Classic Bus",
  "cyber-link": "Cyber Sea Link",
  heritage: "Heritage Gateway",
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GenerationContent({ generation }: GenerationContentProps) {
  if (!generation?.imageUrl) {
    return (
      <div className="flex min-h-[80svh] flex-col items-center justify-center p-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Generation not found</EmptyTitle>
            <EmptyDescription>
              This avatar generation doesn&apos;t exist or has been removed.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/">
                <Sparkles className="mr-2 size-4" />
                Generate your avatar
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Avatar Generation</h1>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center gap-6 p-6">
        {/* Image */}
        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border shadow-lg">
          <Image
            src={generation.imageUrl}
            alt={`ETHMumbai avatar by FID ${generation.fid}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="text-sm">
            {styleLabels[generation.style]}
          </Badge>

          <div className="text-muted-foreground text-sm">
            <p>Created by FID {generation.fid}</p>
            <p>{formatDate(generation._creationTime)}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto w-full max-w-md pb-6">
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              <Sparkles className="mr-2 size-4" />
              Generate your own avatar
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
