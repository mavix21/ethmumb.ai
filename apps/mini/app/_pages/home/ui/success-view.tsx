import Image from "next/image";
import { Download, RotateCcw, Share2 } from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";

import { useAvatar } from "../model/avatar-context";

export function SuccessView() {
  const { send, currentStyle, uploadedImage, generatedImage } = useAvatar();

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `ethmumbai-avatar-${currentStyle.id}.png`;
      link.click();
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent(
      "Check out my ETHMumbai avatar! Created with the ETHMumbai Avatar Generator",
    );
    window.open(`https://warpcast.com/~/compose?text=${text}`, "_blank");
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
      <div className="z-10 flex w-full max-w-lg flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
            Your Avatar is Ready!
          </h2>
          <p className="text-foreground/70">
            <span className="text-brand-cream font-medium">
              {currentStyle.name}
            </span>{" "}
            style
          </p>
        </div>

        {/* Before/After comparison */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Before */}
          <div className="flex flex-col items-center gap-2">
            <div className="border-card h-24 w-24 overflow-hidden rounded-full border-4 shadow-xl md:h-32 md:w-32">
              <Image
                src={uploadedImage ?? "/placeholder.svg"}
                alt="Original photo"
                className="h-full w-full object-cover"
                width={128}
                height={128}
              />
            </div>
            <span className="text-foreground/60 text-xs">Original</span>
          </div>

          {/* Arrow */}
          <div className="text-foreground/60">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>

          {/* After */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-card relative rounded-2xl p-1 shadow-2xl md:p-1.5">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src={
                    generatedImage ||
                    currentStyle.afterImage ||
                    "/placeholder.svg"
                  }
                  alt="Generated ETHMumbai avatar"
                  className="h-32 w-32 object-cover md:h-44 md:w-44"
                  width={176}
                  height={176}
                />
              </div>
            </div>
            <span className="text-foreground/60 text-xs">ETHMumbai Avatar</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleDownload}
            className="bg-brand-cream text-best-red flex-1 gap-2 rounded-full font-bold shadow-lg hover:bg-white"
          >
            <Download className="size-4" />
            Download
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-foreground/30 text-foreground hover:border-foreground/60 flex-1 gap-2 rounded-full border-2 bg-transparent"
          >
            <Share2 className="size-4" />
            Share on Farcaster
          </Button>
        </div>

        <Button
          onClick={() => send({ type: "START_OVER" })}
          variant="ghost"
          className="text-foreground/60 hover:text-foreground hover:bg-secondary gap-2"
        >
          <RotateCcw className="size-4" />
          Start Over
        </Button>
      </div>
    </main>
  );
}
