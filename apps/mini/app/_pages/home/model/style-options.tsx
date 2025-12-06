import type { LucideIcon } from "lucide-react";
import { Bus } from "lucide-react";

import type { StyleId } from "./avatar-machine";

export interface StyleOption {
  id: StyleId;
  name: string;
  icon: LucideIcon;
  beforeImage: string;
  afterImage: string;
}

export const styleOptions: StyleOption[] = [
  {
    id: "classic-best" as const,
    name: "Classic BEST",
    icon: Bus,
    beforeImage: "/examples/classic-before.jpg",
    afterImage: "/examples/classic-after.jpeg",
  },
  // {
  //   id: "cyber-link" as const,
  //   name: "Cyber-Link",
  //   icon: Waves,
  //   beforeImage: "/examples/cyber-before.jpg",
  //   afterImage: "/examples/cyber-after.jpg",
  // },
  // {
  //   id: "heritage" as const,
  //   name: "Heritage",
  //   icon: Landmark,
  //   beforeImage: "/examples/heritage-before.jpg",
  //   afterImage: "/examples/heritage-after.jpg",
  // },
] as const;

// Map for O(1) lookup
const styleMap = new Map<StyleId, StyleOption>(
  styleOptions.map((style) => [style.id, style]),
);

// Default style (first option) - guaranteed to exist at compile time
// since styleOptions is defined with at least one element
const DEFAULT_STYLE: StyleOption = {
  id: "classic-best",
  name: "Classic BEST",
  icon: Bus,
  beforeImage: "/examples/classic-before.jpg",
  afterImage: "/examples/classic-after.jpeg",
};

/**
 * Get a style option by ID. Always returns a valid StyleOption.
 * Falls back to the default style if the ID is not found.
 */
export function getStyleById(id: StyleId): StyleOption {
  return styleMap.get(id) ?? DEFAULT_STYLE;
}
