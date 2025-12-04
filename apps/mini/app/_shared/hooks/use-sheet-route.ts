import type { TravelStatus } from "@silk-hq/components";
import type { Route } from "next";
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseSheetRouteOptions {
  route: Route;
  defaultFallback?: Route;
}

export function useSheetRoute(options: UseSheetRouteOptions) {
  const { route, defaultFallback = "/" } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const presented = pathname === route;
  const origin = searchParams.get("origin");
  const fallbackRoute = (origin ?? defaultFallback) as Route;

  const navigateBack = useCallback(() => {
    router.replace(fallbackRoute, { scroll: false });
  }, [router, fallbackRoute]);

  const onTravelStatusChange = useCallback(
    (status: TravelStatus) => {
      if (status === "idleOutside") {
        navigateBack();
      }
    },
    [navigateBack],
  );

  const onPresentedChange = useCallback(
    (value: boolean) => {
      if (!value) {
        navigateBack();
      }
    },
    [navigateBack],
  );

  return {
    presented,
    onPresentedChange,
    onTravelStatusChange,
  };
}
