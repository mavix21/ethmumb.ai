import * as React from "react";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import {
  ArrowLeft,
  ChevronDown,
  ImageOff,
  Loader2,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ethmumb.ai/ui/components/dropdown-menu";
import { cn } from "@ethmumb.ai/ui/lib/utils";

import { useMiniApp } from "@/shared/context/miniapp-context";

import { useAvatar } from "../model/avatar-context";
import { styleOptions } from "../model/style-options";

/**
 * Robust image component that handles data URL loading with proper error states
 */
function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    "loading",
  );
  // Use a hash of the src to detect changes (length is a quick proxy)
  const srcKey = React.useMemo(
    () => `img-${src.length}-${src.slice(-20)}`,
    [src],
  );

  // Reset status when src changes
  React.useEffect(() => {
    console.log("[PreviewImage] src changed, resetting status", {
      length: src.length,
      prefix: src.substring(0, 50),
    });
    setStatus("loading");

    // Timeout fallback: if image hasn't loaded in 5 seconds, show error
    const timeout = setTimeout(() => {
      setStatus((current) => {
        if (current === "loading") {
          console.error("[PreviewImage] Image load timeout after 5s");
          return "error";
        }
        return current;
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [src]);

  return (
    <div className="relative min-h-[200px] min-w-[200px]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100 p-4">
          <ImageOff className="h-8 w-8 text-gray-400" />
          <p className="text-center text-sm text-gray-500">
            Failed to load image
          </p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={srcKey}
        src={src}
        alt={alt}
        className={cn(
          "block max-h-[360px] max-w-[360px] object-contain",
          status !== "loaded" && "invisible",
        )}
        onLoad={() => {
          console.log("[PreviewImage] Image loaded successfully");
          setStatus("loaded");
        }}
        onError={(e) => {
          console.error("[PreviewImage] Image failed to load:", {
            srcLength: src.length,
            srcPrefix: src.substring(0, 100),
            error: e,
          });
          setStatus("error");
        }}
      />
    </div>
  );
}

export function ConfirmationView() {
  const {
    send,
    selectedStyle,
    currentStyle,
    uploadedImage,
    isWalletConnected,
    isGenerating,
  } = useAvatar();
  const { context } = useMiniApp();

  const CurrentIcon = currentStyle.icon;

  // Debug logging
  React.useEffect(() => {
    console.log("[ConfirmationView] uploadedImage state:", {
      exists: !!uploadedImage,
      length: uploadedImage?.length ?? 0,
      prefix: uploadedImage?.substring(0, 100) ?? "null",
      isDataUrl: uploadedImage?.startsWith("data:") ?? false,
    });
  }, [uploadedImage]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
      {/* Back button */}
      <button
        onClick={() => send({ type: "CANCEL" })}
        className="text-foreground/70 hover:text-foreground absolute top-4 left-4 z-20 flex items-center gap-1.5 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 md:top-8 md:left-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
            Ready to transform?
          </h2>
          <p className="text-foreground/70 text-sm md:text-base">
            Your photo will become a{" "}
            <span className="text-brand-cream font-medium">
              {currentStyle.name}
            </span>{" "}
            avatar
          </p>
        </div>

        {/* Image preview - using native img for reliable data URL rendering */}
        {uploadedImage && (
          <div className="relative">
            {/* Glow effect */}
            <div className="bg-brand-cream/20 absolute inset-0 -z-10 blur-3xl" />

            {/* Image container */}
            <div className="overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl">
              <PreviewImage src={uploadedImage} alt="Your photo" />
            </div>

            {/* Style badge with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-brand-cream text-best-red hover:bg-brand-cream/90 absolute -right-2 -bottom-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg transition-colors disabled:pointer-events-none disabled:opacity-50">
                  <CurrentIcon className="h-3.5 w-3.5" />
                  {currentStyle.name}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {styleOptions.map((style) => {
                  const Icon = style.icon;
                  return (
                    <DropdownMenuItem
                      key={style.id}
                      onClick={() =>
                        send({ type: "SELECT_STYLE", style: style.id })
                      }
                      className={cn(
                        "flex cursor-pointer items-center gap-2",
                        selectedStyle === style.id &&
                          "bg-brand-cream/20 text-best-red",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          selectedStyle === style.id
                            ? "text-best-red"
                            : "text-foreground/50",
                        )}
                      />
                      <span>{style.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* BEST Bus Ticket Style Price */}
        {/* <BestBusTicketPrice /> */}

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          {!isWalletConnected ? (
            <Wallet className="w-full">
              <ConnectWallet className="w-full">
                <WalletIcon className="mr-2 h-5 w-5" />
                <span>Connect Wallet to Generate</span>
              </ConnectWallet>
            </Wallet>
          ) : (
            <Button
              onClick={() =>
                send({ type: "CONFIRM_PAY", fid: context?.user.fid })
              }
              disabled={isGenerating}
              size="lg"
              className="w-full font-medium"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  Confirm in Wallet...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Pay 0.2 USDC and Generate My Avatar
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => send({ type: "CANCEL" })}
            disabled={isGenerating}
          >
            Choose a different photo
          </Button>
        </div>
      </div>
    </main>
  );
}
