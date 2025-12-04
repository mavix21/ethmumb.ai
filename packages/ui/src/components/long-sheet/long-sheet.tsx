"use client";

import * as React from "react";
import { Scroll, Sheet } from "@silk-hq/components";

import { useBlurOnTravelStart } from "@myapp/ui/hooks/use-blur-on-travel-start";
import { cn } from "@myapp/ui/lib/utils";

// ================================================================================================
// Context
// ================================================================================================

interface LongSheetContextType {
  setTrack: (track: "top" | "bottom") => void;
  restingOutside: boolean;
}

const LongSheetContext = React.createContext<LongSheetContextType | null>(null);

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type LongSheetRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const LongSheetRoot = React.forwardRef<
  React.ComponentRef<typeof Sheet.Root>,
  LongSheetRootProps
>(({ children, ...restProps }, ref) => {
  return (
    <Sheet.Root license="non-commercial" {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  );
});
LongSheetRoot.displayName = "LongSheet.Root";

// ================================================================================================
// View
// ================================================================================================

const LongSheetView = React.forwardRef<
  React.ComponentRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, onTravelStatusChange, onTravelStart, ...restProps }, ref) => {
  const [restingOutside, setRestingOutside] = React.useState(false);
  const [track, setTrack] = React.useState<"top" | "bottom">("bottom");
  const handleTravelStart = useBlurOnTravelStart(onTravelStart);

  React.useEffect(() => {
    if (restingOutside) {
      setTrack("bottom");
    }
  }, [restingOutside]);

  return (
    <LongSheetContext.Provider value={{ setTrack, restingOutside }}>
      <Sheet.View
        className={cn("LongSheet-view", className)}
        contentPlacement="center"
        tracks={track}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention={true}
        enteringAnimationSettings={{
          easing: "spring",
          stiffness: 480,
          damping: 45,
          mass: 1.5,
        }}
        onTravelStart={handleTravelStart}
        onTravelStatusChange={(status) => {
          setRestingOutside(status === "idleOutside");
          onTravelStatusChange?.(status);
        }}
        {...restProps}
        ref={ref}
      >
        {children}
      </Sheet.View>
    </LongSheetContext.Provider>
  );
});
LongSheetView.displayName = "LongSheet.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const LongSheetBackdrop = React.forwardRef<
  React.ComponentRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={cn("LongSheet-backdrop", className)}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
LongSheetBackdrop.displayName = "LongSheet.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const LongSheetContent = React.forwardRef<
  React.ComponentRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  const scrollRef = React.useRef<any>(null);
  const context = React.useContext(LongSheetContext);
  if (!context) {
    throw new Error(
      "LongSheetContent must be used within a LongSheetContext.Provider",
    );
  }
  const { setTrack, restingOutside } = context;

  const scrollHandler = React.useCallback(
    ({ progress }: { progress: number }) => {
      if (restingOutside) return; // ! Checking because it may scroll to 1 when outside
      setTrack(progress < 0.5 ? "bottom" : "top");
    },
    [restingOutside, setTrack],
  );

  return (
    <Sheet.Content
      className={cn("LongSheet-content", className)}
      asChild
      {...restProps}
      ref={ref}
    >
      <Scroll.Root
        className="LongSheet-scrollRoot"
        componentRef={scrollRef}
        asChild
      >
        <Scroll.View className="LongSheet-scrollView" onScroll={scrollHandler}>
          <Scroll.Content className="LongSheet-scrollContent">
            <div className="LongSheet-innerContent">{children}</div>
          </Scroll.Content>
        </Scroll.View>
      </Scroll.Root>
    </Sheet.Content>
  );
});
LongSheetContent.displayName = "LongSheet.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const LongSheetPortal = Sheet.Portal;
const LongSheetTrigger = Sheet.Trigger;
const LongSheetHandle = Sheet.Handle;
const LongSheetOutlet = Sheet.Outlet;
const LongSheetTitle = Sheet.Title;
const LongSheetDescription = Sheet.Description;

export const LongSheet = {
  Root: LongSheetRoot,
  Portal: LongSheetPortal,
  View: LongSheetView,
  Backdrop: LongSheetBackdrop,
  Content: LongSheetContent,
  Trigger: LongSheetTrigger,
  Handle: LongSheetHandle,
  Outlet: LongSheetOutlet,
  Title: LongSheetTitle,
  Description: LongSheetDescription,
};
