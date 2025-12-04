"use client";

import React from "react";
import { Sheet } from "@silk-hq/components";

import { useBlurOnTravelStart } from "@myapp/ui/hooks/use-blur-on-travel-start";
import { cn } from "@myapp/ui/lib/utils";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type CardRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const CardRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  CardRootProps
>(({ children, ...restProps }, ref) => {
  return (
    <Sheet.Root license="non-commercial" {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  );
});
CardRoot.displayName = "Card.Root";

// ================================================================================================
// View
// ================================================================================================

const CardView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, onTravelStart, ...restProps }, ref) => {
  const handleTravelStart = useBlurOnTravelStart(onTravelStart);

  return (
    <Sheet.View
      className={cn("Card-view", className)}
      contentPlacement="center"
      tracks="top"
      enteringAnimationSettings={{
        easing: "spring",
        stiffness: 260,
        damping: 20,
        mass: 1,
      }}
      nativeEdgeSwipePrevention={true}
      onTravelStart={handleTravelStart}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
CardView.displayName = "Card.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const CardBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={cn("Card-backdrop", className)}
      travelAnimation={{
        opacity: ({ progress }) => Math.min(0.4 * progress, 0.4),
      }}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
CardBackdrop.displayName = "Card.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const CardContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={cn("Card-content", className)}
      travelAnimation={{ scale: [0.8, 1] }}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
CardContent.displayName = "Card.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const CardPortal = Sheet.Portal;
const CardTrigger = Sheet.Trigger;
const CardHandle = Sheet.Handle;
const CardOutlet = Sheet.Outlet;
const CardTitle = Sheet.Title;
const CardDescription = Sheet.Description;

export const Card = {
  Root: CardRoot,
  Portal: CardPortal,
  View: CardView,
  Backdrop: CardBackdrop,
  Content: CardContent,
  Trigger: CardTrigger,
  Handle: CardHandle,
  Outlet: CardOutlet,
  Title: CardTitle,
  Description: CardDescription,
};
