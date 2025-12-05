import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Suspense } from "react";
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
        className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <Suspense fallback={null}>
          <OnchainKitClientProvider>
            <MiniAppProvider>
              <ConvexClientProvider>
                <AuthProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    enableColorScheme
                  >
                    {children}
                  </ThemeProvider>
                  <BottomNav />
                </AuthProvider>
              </ConvexClientProvider>
            </MiniAppProvider>
          </OnchainKitClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
