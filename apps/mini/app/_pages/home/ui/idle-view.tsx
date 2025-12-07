import * as React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

import { Badge } from "@ethmumb.ai/ui/components/badge";
import { Button } from "@ethmumb.ai/ui/components/button";

import { useAvatar } from "../model/avatar-context";

function CurvyArrow() {
  return (
    <svg
      width="50"
      height="70"
      viewBox="0 0 50 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-brand-white rotate-12 drop-shadow-sm"
    >
      {/* Hand-drawn style semi-elliptical curve with slight wobble */}
      <path
        d="M38 64C36 62 8 58 4 38C2 22 18 12 32 9C36 8 40 8 44 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
      {/* Slightly imperfect arrowhead */}
      <path
        d="M38 4L46 11L40 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IdleView() {
  const { send, selectedStyle, currentStyle } = useAvatar();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        send({
          type: "FILE_SELECTED",
          image: event.target?.result as string,
          file,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [send],
  );

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 pt-20 md:p-8 md:pt-24">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative z-10 mb-6 md:mb-8">
        <div className="relative rotate-2 rounded-2xl bg-white p-1.5 shadow-2xl transition-transform hover:rotate-0 md:p-2">
          <div className="overflow-hidden rounded-xl">
            <Image
              priority
              key={`after-${selectedStyle}`}
              src={currentStyle.afterImage || "/placeholder.svg"}
              alt={`Example ETHMumbai avatar - ${currentStyle.name} style`}
              width={224}
              height={224}
              className="h-56 w-56 object-cover sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-80 lg:w-80"
            />
          </div>
        </div>

        <div className="absolute -bottom-4 -left-6 sm:-bottom-6 sm:-left-8 md:-bottom-8 md:-left-10">
          {/* Arrow positioned to the left of the before image, curving up to the after image */}
          <div className="absolute -top-12 -left-8 sm:-top-16 sm:-left-10 md:-top-20 md:-left-12">
            <CurvyArrow />
          </div>
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-20 sm:w-20 md:h-24 md:w-24">
            <Image
              key={`before-${selectedStyle}`}
              src={currentStyle.beforeImage || "/placeholder.svg"}
              alt="Original photo before transformation"
              className="h-full w-full object-cover"
              fill
              sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
            />
          </div>
        </div>
      </div>

      <h1 className="font-display text-foreground z-10 mb-1 text-center text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
        Your Mumbai Moment
      </h1>
      <p className="font-display text-foreground/90 z-10 mb-1 text-center text-lg font-medium sm:text-xl md:text-2xl">
        ✨ AI-Powered Avatar Magic ✨
      </p>
      <p className="text-foreground/70 z-10 mb-6 max-w-md px-4 text-center text-sm md:mb-8 md:text-base">
        Drop your selfie and watch your photo transform into stunning
        Mumbai-inspired art in seconds
      </p>

      {/* <div className="z-10 mb-6 flex flex-wrap items-center justify-center gap-2 px-4">
        <span className="text-foreground/70 mr-1 text-xs">
          Pick your style:
        </span>
        {styleOptions.map((style) => {
          const Icon = style.icon;
          return (
            <button
              key={style.id}
              onClick={() => send({ type: "SELECT_STYLE", style: style.id })}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                "border-2",
                selectedStyle === style.id
                  ? "bg-brand-cream text-best-red border-brand-cream shadow-lg"
                  : "text-foreground border-foreground/30 hover:border-foreground/60 bg-transparent",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {style.name}
            </button>
          );
        })}
      </div> */}

      <Button size="lg" onClick={handleUploadClick} className="w-full max-w-md">
        <Sparkles className="h-5 w-5" />
        <span>Create My Avatar</span>
      </Button>

      <p className="text-foreground/50 z-10 mt-3 text-center text-xs">
        No sign-up • Ready in ~10 seconds
      </p>

      <div className="text-foreground/60 z-10 mt-4 flex flex-wrap items-center justify-center gap-2 px-4 text-sm md:gap-3">
        <span className="text-xs md:text-sm">Supports:</span>
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          {["JPG", "JPEG", "PNG", "WEBP"].map((format) => (
            <Badge key={format} variant="secondary">
              {format}
            </Badge>
          ))}
        </div>
      </div>
    </main>
  );
}
