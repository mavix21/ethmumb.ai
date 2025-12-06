import Image from "next/image";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import { Button } from "@ethmumb.ai/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ethmumb.ai/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ethmumb.ai/ui/components/dropdown-menu";
import { cn } from "@ethmumb.ai/ui/lib/utils";

import { useAvatar } from "../model/avatar-context";
import { styleOptions } from "../model/style-options";

export function ConfirmationView() {
  const {
    send,
    selectedStyle,
    currentStyle,
    uploadedImage,
    isPaying,
    isUserConfirming,
  } = useAvatar();
  const CurrentIcon = currentStyle.icon;

  const isOpen = isUserConfirming || isPaying;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && send({ type: "CANCEL" })}
    >
      <DialogContent className="bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Your Avatar</DialogTitle>
          <DialogDescription className="text-card-foreground/60">
            Your photo will be transformed into a{" "}
            <span className="text-best-red font-medium">
              {currentStyle.name}
            </span>{" "}
            style ETHMumbai avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {uploadedImage && (
            <div className="relative">
              <div className="border-border overflow-hidden rounded-xl border-2 shadow-lg">
                <Image
                  src={uploadedImage || "/placeholder.svg"}
                  alt="Your uploaded photo"
                  className="h-48 w-48 object-cover"
                  width={192}
                  height={192}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isPaying}>
                  <button className="bg-best-red hover:bg-best-red/90 absolute -right-2 -bottom-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                    <CurrentIcon className="h-3 w-3" />
                    {currentStyle.name}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
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
                            "bg-best-red/10 text-best-red",
                        )}
                      >
                        <Icon
                          className={cn(
                            "text-best-red/10 size-4",
                            selectedStyle === style.id && "text-best-red",
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

          {/* Pricing summary */}
          <div className="bg-muted/30 w-full space-y-2 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-card-foreground/60">Avatar Generation</span>
              <span className="text-card-foreground font-medium">
                0.25 USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-card-foreground/60">Network Fee</span>
              <span className="text-card-foreground font-medium">
                ~0.001 ETH
              </span>
            </div>
            <div className="border-border flex justify-between border-t pt-2">
              <span className="text-card-foreground font-semibold">Total</span>
              <span className="text-best-red font-bold">0.25 USDC</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => send({ type: "CANCEL" })}
            disabled={isPaying}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => send({ type: "CONFIRM_PAY" })}
            disabled={isPaying}
            className="bg-best-red hover:bg-best-red/90 flex-1 gap-2 text-white sm:flex-none"
          >
            {isPaying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Pay 0.25 USDC & Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
