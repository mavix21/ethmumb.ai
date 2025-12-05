import Image from "next/image";
import { Loader2, ScanSearch } from "lucide-react";

import { useAvatar } from "../model/avatar-context";

export function AnalyzingView() {
  const { uploadedImage } = useAvatar();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="border-card relative h-32 w-32 overflow-hidden rounded-xl border-4 shadow-2xl md:h-40 md:w-40">
            <Image
              src={uploadedImage ?? "/placeholder.svg"}
              alt="Analyzing your photo"
              className="h-full w-full object-cover"
              width={128}
              height={128}
            />
          </div>
          <div className="bg-bus-black/30 absolute inset-0 overflow-hidden rounded-xl">
            <div className="bg-brand-cream animate-scan absolute inset-x-0 h-1" />
          </div>
          <div className="bg-card absolute -right-3 -bottom-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg">
            <ScanSearch className="text-best-red h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="font-display text-foreground mb-2 text-xl font-bold md:text-2xl">
            Analyzing Image
          </h2>
          <p className="text-foreground/70 text-sm">
            Checking your photo meets our content guidelines...
          </p>
        </div>

        <div className="text-foreground/60 flex items-center gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>This will only take a moment</span>
        </div>
      </div>
    </main>
  );
}
