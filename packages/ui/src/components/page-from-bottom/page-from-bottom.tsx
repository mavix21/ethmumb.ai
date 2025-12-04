"use client";

import React from "react";
import { Sheet } from "@silk-hq/components";

import "./PageFromBottom.css";

import { useBlurOnTravelStart } from "@myapp/ui/hooks/use-blur-on-travel-start";
import { cn } from "@myapp/ui/lib/utils";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type PageFromBottomRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const PageFromBottomRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  PageFromBottomRootProps
>((props, ref) => {
  return (
    <Sheet.Root license="non-commercial" {...props} ref={ref}></Sheet.Root>
  );
});
PageFromBottomRoot.displayName = "PageFromBottom.Root";

// ================================================================================================
// View
// ================================================================================================

const PageFromBottomView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, onTravelStart, ...restProps }, ref) => {
  const handleTravelStart = useBlurOnTravelStart(onTravelStart);

  return (
    <Sheet.View
      className={cn(`PageFromBottom-view`, className)}
      contentPlacement="bottom"
      swipe={false}
      nativeEdgeSwipePrevention={true}
      onTravelStart={handleTravelStart}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
PageFromBottomView.displayName = "PageFromBottom.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const PageFromBottomBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={cn(`PageFromBottom-backdrop`, className)}
      travelAnimation={{ opacity: [0, 0.1] }}
      {...restProps}
      ref={ref}
    />
  );
});
PageFromBottomBackdrop.displayName = "PageFromBottom.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const PageFromBottomContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={cn(`PageFromBottom-content`, className)}
      {...restProps}
      ref={ref}
    >
      <div className="PageFromBottom-topBar">
        <Sheet.Trigger
          className="PageFromBottom-dismissTrigger"
          action="dismiss"
        >
          Close
        </Sheet.Trigger>
      </div>
      {children}
    </Sheet.Content>
  );
});
PageFromBottomContent.displayName = "PageFromBottom.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const PageFromBottomPortal = Sheet.Portal;
const PageFromBottomTrigger = Sheet.Trigger;
const PageFromBottomHandle = Sheet.Handle;
const PageFromBottomOutlet = Sheet.Outlet;
const PageFromBottomTitle = Sheet.Title;
const PageFromBottomDescription = Sheet.Description;

export const PageFromBottom = {
  Root: PageFromBottomRoot,
  Portal: PageFromBottomPortal,
  View: PageFromBottomView,
  Backdrop: PageFromBottomBackdrop,
  Content: PageFromBottomContent,
  Trigger: PageFromBottomTrigger,
  Handle: PageFromBottomHandle,
  Outlet: PageFromBottomOutlet,
  Title: PageFromBottomTitle,
  Description: PageFromBottomDescription,
};
