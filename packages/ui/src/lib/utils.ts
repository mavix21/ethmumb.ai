import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Blurs the currently focused element if it exists.
 * Used to prevent "Blocked aria-hidden on an element because its descendant retained focus"
 * warnings when sheets are dismissed.
 */
export function blurActiveElement() {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
