import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Sora } from "next/font/google";
import { preconnect } from "react-dom";

import { AuthProvider } from "@/app/_contexts/auth-context";
import { ConvexClientProvider } from "@/app/_providers/convex-cllient.provider";
import { minikitConfig } from "@/minikit.config";
import { MiniAppProvider } from "@/shared/context/miniapp-context";
import { BottomNav } from "@/widgets/navigation";

import { OnchainKitClientProvider } from "./_providers/onchainkit.provider";
import { ThemeProvider } from "./_providers/theme-provider";

import "@coinbase/onchainkit/styles.css";
import "@ethmumb.ai/ui/globals.css";
import "@silk-hq/components/layered-styles.css";

import { env } from "@/env";
import { Header } from "@/shared/ui/header";

import { ErudaProvider } from "./_providers/eruda";
import { MumbaiBackground } from "./_ui/mumbai-animated-background";

export async function generateMetadata(): Promise<Metadata> {
  return Promise.resolve({
    title: minikitConfig.frame.name,
    description: minikitConfig.frame.description,
    keywords: ["ethmumbai", "x402", "image generation", "farcaster"],
    authors: [{ name: "mavix" }],
    // Open Graph metadata for social sharing and embeds
    openGraph: {
      title: minikitConfig.frame.name,
      description: minikitConfig.frame.description,
      type: "website",
      url: env.SITE_URL,
      siteName: minikitConfig.frame.name,
      images: [
        {
          url: minikitConfig.frame.heroImageUrl,
          width: 1200,
          height: 630,
          alt: "EthMumbai Avatar Generator",
        },
      ],
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: minikitConfig.frame.name,
      description: minikitConfig.frame.description,
      images: [minikitConfig.frame.heroImageUrl],
    },

    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: minikitConfig.frame.name,
    },
    formatDetection: {
      telephone: false,
    },
    robots: {
      index: false,
      follow: false,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.frame.version,
        imageUrl: minikitConfig.frame.heroImageUrl,
        button: {
          title: `Generate your ETHMumbai Avatar`,
          action: {
            name: `Generate your ETHMumbai Avatar`,
            type: "launch_frame",
          },
        },
      }),
    },
  });
}

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceCodePro = Sora({
  variable: "--font-acc",
  subsets: ["latin"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  preconnect("https://auth.farcaster.xyz");

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} size-full font-sans antialiased`}
      >
        <Suspense fallback={null}>
          <ErudaProvider>
            <OnchainKitClientProvider>
              <MiniAppProvider>
                <ConvexClientProvider>
                  <AuthProvider>
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="light"
                      disableTransitionOnChange
                      enableColorScheme
                    >
                      <div
                        key="mumbai-bg-container"
                        className="bg-background fixed inset-0"
                      >
                        <MumbaiBackground />
                      </div>
                      <div className="relative z-1 flex h-[calc(100svh-4rem)] flex-col">
                        <Header />
                        {children}
                      </div>
                      <BottomNav showPrimaryAction={false} />
                    </ThemeProvider>
                  </AuthProvider>
                </ConvexClientProvider>
              </MiniAppProvider>
            </OnchainKitClientProvider>
          </ErudaProvider>
        </Suspense>
      </body>
    </html>
  );
}
