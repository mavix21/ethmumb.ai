import type { TravelStatus } from "@silk-hq/components";
import type { Route } from "next";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook for hard navigation sheet pages.
 * Sheet animates in on mount (defaultPresented), navigates to fallback on dismiss.
 */
export function useSheetPage(fallbackRoute: Route = "/") {
  const router = useRouter();
  const hasNavigated = useRef(false);

  // Reset the navigation guard when the component mounts.
  // This ensures a fresh state for each new navigation to this route.
  useEffect(() => {
    hasNavigated.current = false;
  }, []);

  const onTravelStatusChange = useCallback(
    (status: TravelStatus) => {
      if (status === "idleOutside" && !hasNavigated.current) {
        hasNavigated.current = true;
        router.replace(fallbackRoute);
      }
    },
    [router, fallbackRoute],
  );

  return {
    onTravelStatusChange,
  };
}
