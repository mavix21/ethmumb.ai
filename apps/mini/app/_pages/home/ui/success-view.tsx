import Image from "next/image";
import { Download, Plus, Share2 } from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";

import { useAvatar } from "../model/avatar-context";
import { useImageDimensions } from "../model/use-image-dimensions";

export function SuccessView() {
  const { send, currentStyle, generatedImage } = useAvatar();
  const imageDimensions = useImageDimensions(generatedImage);

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
      "Check out my ETHMumbai avatar! 🚌✨ Created with the ETHMumbai Avatar Generator",
    );
    window.open(`https://warpcast.com/~/compose?text=${text}`, "_blank");
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
      <div className="z-10 flex w-full max-w-md flex-col items-center gap-6">
        {/* Celebratory header */}
        <div className="text-center">
          <p className="text-brand-cream mb-1 text-sm font-medium">
            🎉 Success!
          </p>
          <h2 className="font-display text-foreground mb-2 text-2xl font-bold md:text-3xl">
            Your Avatar is Ready
          </h2>
          <p className="text-foreground/60 text-sm">
            <span className="text-brand-cream font-medium">
              {currentStyle.name}
            </span>{" "}
            style
          </p>
        </div>

        {/* Generated image with natural dimensions */}
        {generatedImage && imageDimensions && (
          <div className="relative">
            {/* Glow effect */}
            <div className="bg-brand-cream/30 absolute inset-0 -z-10 blur-3xl" />

            {/* Image container */}
            <div className="overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl">
              <Image
                src={generatedImage}
                alt="Your ETHMumbai avatar"
                width={imageDimensions.width}
                height={imageDimensions.height}
                className="block max-h-88 w-auto"
                priority
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">
              <Download className="size-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Share2 className="size-4" />
              Share
            </Button>
          </div>

          <Button
            onClick={() => send({ type: "START_OVER" })}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            <Plus className="size-4" />
            Create Another Avatar
          </Button>
        </div>
      </div>
    </main>
  );
}
