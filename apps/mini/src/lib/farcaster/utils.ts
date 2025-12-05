import type { MiniAppHostCapability } from "@farcaster/miniapp-core";
import type {
  ImpactOccurredType,
  NotificationOccurredType,
} from "@farcaster/miniapp-core/dist/actions/Haptics";
import type { MiniAppContext } from "@farcaster/miniapp-core/dist/context";
import sdk from "@farcaster/miniapp-sdk";

/**
 * Trigger a haptic feedback on farcaster mobile
 * @param context - The context of the mini app
 * @param capabilities - The capabilities of the mini app
 * @param hapticType - The type of haptic feedback
 * @param hapticStyle - The style of haptic feedback
 */
export const triggerHaptics = (
  context: MiniAppContext | null,
  capabilities: MiniAppHostCapability[] | null,
  hapticType:
    | "haptics.impactOccurred"
    | "haptics.notificationOccurred"
    | "haptics.selectionChanged",
  hapticStyle: ImpactOccurredType | NotificationOccurredType | "selection",
) => {
  if (!context || !capabilities?.includes(hapticType)) {
    console.warn(
      "Haptics capability not available in this context or mini app",
    );
    return;
  }

  switch (hapticType) {
    case "haptics.impactOccurred":
      void sdk.haptics.impactOccurred(hapticStyle as ImpactOccurredType);
      break;
    case "haptics.notificationOccurred":
      void sdk.haptics.notificationOccurred(
        hapticStyle as NotificationOccurredType,
      );
      break;
    case "haptics.selectionChanged":
      void sdk.haptics.selectionChanged();
      break;
    default:
      console.warn("Unknown haptic type:", hapticType);
  }
};
