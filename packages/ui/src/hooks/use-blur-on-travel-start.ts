import { useCallback } from "react";

import { blurActiveElement } from "@myapp/ui/lib/utils";

/**
 * Hook that wraps an onTravelStart callback to blur the active element first.
 *
 * This prevents the "Blocked aria-hidden on an element because its descendant
 * retained focus" warning that occurs when sheets are dismissed while focus
 * is still inside the sheet.
 *
 * @param onTravelStart - Optional callback to run after blurring
 * @returns A wrapped onTravelStart handler
 */
export function useBlurOnTravelStart(onTravelStart?: () => void) {
  return useCallback(() => {
    blurActiveElement();
    onTravelStart?.();
  }, [onTravelStart]);
}
