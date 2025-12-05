import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Sora } from "next/font/google";
import { preconnect } from "react-dom";

import { AuthProvider } from "@/app/_contexts/auth-context";
import { MiniAppProvider } from "@/app/_contexts/miniapp-context";
import { ConvexClientProvider } from "@/app/_providers/convex-cllient.provider";
import { minikitConfig } from "@/minikit.config";
import { BottomNav } from "@/widgets/navigation";

import { OnchainKitClientProvider } from "./_providers/onchainkit.provider";
import { ThemeProvider } from "./_providers/theme-provider";

import "@coinbase/onchainkit/styles.css";
import "@ethmumb.ai/ui/globals.css";
import "@silk-hq/components/layered-styles.css";

import { MumbaiBackground } from "./_ui/mumbai-animated-background";

export async function generateMetadata(): Promise<Metadata> {
  return Promise.resolve({
    title: minikitConfig.frame.name,
    description: minikitConfig.frame.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.frame.version,
        imageUrl: minikitConfig.frame.heroImageUrl,
        button: {
          title: `Launch ${minikitConfig.frame.name}`,
          action: {
            name: `Launch ${minikitConfig.frame.name}`,
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
                    <div className="relative z-1">{children}</div>
                  </ThemeProvider>
                  <BottomNav showPrimaryAction={false} />
                </AuthProvider>
              </ConvexClientProvider>
            </MiniAppProvider>
          </OnchainKitClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
