import Image from "next/image";
import {
  ArrowLeft,
  BusFrontIcon,
  ChevronDown,
  Loader2,
  Sparkles,
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
import { useImageDimensions } from "../model/use-image-dimensions";

export function ConfirmationView() {
  const { send, selectedStyle, currentStyle, uploadedImage, isPaying } =
    useAvatar();
  const { context } = useMiniApp();
  const imageDimensions = useImageDimensions(uploadedImage);

  const CurrentIcon = currentStyle.icon;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 md:p-8">
      {/* Back button */}
      <button
        onClick={() => send({ type: "CANCEL" })}
        disabled={isPaying}
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

        {/* Image preview with natural aspect ratio */}
        {uploadedImage && imageDimensions && (
          <div className="relative">
            {/* Glow effect */}
            <div className="bg-brand-cream/20 absolute inset-0 -z-10 blur-3xl" />

            {/* Image container */}
            <div className="overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl">
              <Image
                src={uploadedImage}
                alt="Your photo"
                width={imageDimensions.width}
                height={imageDimensions.height}
                className="block h-auto max-h-88 w-auto"
                priority
              />
            </div>

            {/* Style badge with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isPaying}>
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
          <Button
            onClick={() =>
              send({ type: "CONFIRM_PAY", fid: context?.user.fid })
            }
            disabled={isPaying}
            size="lg"
            className="w-full font-medium"
          >
            {isPaying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate My Avatar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => send({ type: "CANCEL" })}
            disabled={isPaying}
          >
            Choose a different photo
          </Button>
        </div>
      </div>
    </main>
  );
}

function BestBusTicketPrice() {
  return (
    <div className="relative">
      {/* Ticket notches - left side */}
      <div className="bg-background absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rounded-full" />
      {/* Ticket notches - right side */}
      <div className="bg-background absolute top-1/2 -right-2 h-4 w-4 -translate-y-1/2 rounded-full" />

      <div className="bg-brand-cream border-best-red relative overflow-hidden rounded-lg border-2 border-dashed px-6 py-4">
        {/* Diagonal stripes background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
                  45deg,
                  #e2231a,
                  #e2231a 1px,
                  transparent 1px,
                  transparent 8px
                )`,
          }}
        />

        {/* Ticket content */}
        <div className="relative flex items-center gap-4">
          {/* Left: Route style badge */}
          <div className="bg-best-red flex h-12 w-12 shrink-0 items-center justify-center rounded">
            <BusFrontIcon />
          </div>

          {/* Center: Price info */}
          <div className="flex-1 text-left">
            <p className="text-best-red font-mono text-xl font-bold tracking-tight">
              0.25 USDC
            </p>
            <p className="text-best-red/60 font-mono text-xs tracking-wider uppercase">
              One-time fare
            </p>
          </div>

          {/* Right: Serial number style */}
          <div className="border-best-red/30 text-best-red/40 shrink-0 border-l pl-3 font-mono text-[10px]">
            <div>AVATAR</div>
            <div>GEN-001</div>
          </div>
        </div>
      </div>
    </div>
  );
}
