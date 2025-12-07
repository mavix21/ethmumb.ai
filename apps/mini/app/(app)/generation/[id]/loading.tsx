import { Skeleton } from "@ethmumb.ai/ui/components/skeleton";

export default function GenerationLoading() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Skeleton className="size-10 rounded-md" />
        <Skeleton className="h-6 w-40" />
      </header>

      {/* Main content skeleton */}
      <main className="flex flex-1 flex-col items-center gap-6 p-6">
        {/* Image skeleton */}
        <Skeleton className="aspect-square w-full max-w-md rounded-2xl" />

        {/* Info skeleton */}
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* CTA skeleton */}
        <div className="mt-auto w-full max-w-md pb-6">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </main>
    </div>
  );
}
