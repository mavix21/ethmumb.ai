import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { fetchQuery } from "convex/nextjs";

import { api } from "@ethmumb.ai/convex/_generated/api";

import { ROOT_URL } from "@/lib/constants";
import { minikitConfig } from "@/minikit.config";
import { GenerationContent } from "@/pages/generation/generation-content";

// Cached data fetching function - id becomes part of cache key
async function getGeneration(id: string) {
  "use cache";
  cacheLife("hours");
  return fetchQuery(api.generations.getById, { id });
}

// Required for Cache Components - must return at least one param for build validation
// Real params will be generated at runtime via ISR
export function generateStaticParams() {
  return [{ id: "j575rvz5tdeg6qc562v8ytjb097wvv1d" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const generation = await getGeneration(id);

  const defaultImageUrl = minikitConfig.frame.heroImageUrl;
  const appName = minikitConfig.frame.name;

  if (!generation?.imageUrl) {
    return {
      title: "Generation not found",
      description:
        "This generation does not exist. Create your own ETHMumbai avatar!",
      openGraph: {
        title: "Generation not found",
        description: "Create your own ETHMumbai avatar!",
        type: "website",
        url: `${ROOT_URL}/generation/${id}`,
        siteName: appName,
        images: [
          {
            url: defaultImageUrl,
            width: 1200,
            height: 630,
            alt: "ETHMumbai Avatar Generator",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Generation not found",
        description: "Create your own ETHMumbai avatar!",
        images: [defaultImageUrl],
      },
    };
  }

  const title = `ETHMumbai Avatar by FID ${generation.fid}`;
  const description = `Check out this ${generation.style} style ETHMumbai avatar! Generate yours now.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${ROOT_URL}/generation/${id}`,
      siteName: appName,
      images: [
        { url: generation.imageUrl, width: 1200, height: 630, alt: title },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [generation.imageUrl],
      creator: "@ethmumbai",
      site: "@ethmumbai",
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: generation.imageUrl,
        button: {
          title: "Generate your avatar",
          action: {
            type: "launch_frame",
            name: appName,
            url: ROOT_URL,
          },
        },
      }),
    },
  };
}

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const generation = await getGeneration(id);

  return <GenerationContent generation={generation} />;
}
