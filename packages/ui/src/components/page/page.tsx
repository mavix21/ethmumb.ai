"use client";

import React from "react";
import { Sheet } from "@silk-hq/components";
import { ChevronLeft } from "lucide-react";

import { Button } from "@myapp/ui/components/button";
import { useBlurOnTravelStart } from "@myapp/ui/hooks/use-blur-on-travel-start";
import { cn } from "@myapp/ui/lib/utils";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type PageRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const PageRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  PageRootProps
>(({ children, ...restProps }, ref) => {
  return (
    <Sheet.Root license="non-commercial" {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  );
});
PageRoot.displayName = "Page.Root";

// ================================================================================================
// View
// ================================================================================================

const PageView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, onTravelStart, ...restProps }, ref) => {
  const handleTravelStart = useBlurOnTravelStart(onTravelStart);

  return (
    <Sheet.View
      className={cn("Page-view", className)}
      contentPlacement="right"
      swipeOvershoot={false}
      nativeEdgeSwipePrevention={true}
      onTravelStart={handleTravelStart}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
PageView.displayName = "Page.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const PageBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={cn("Page-backdrop", className)}
      {...restProps}
      ref={ref}
    />
  );
});
PageBackdrop.displayName = "Page.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const PageContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={cn("Page-content", className)}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
PageContent.displayName = "Page.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const PagePortal = Sheet.Portal;
const PageTrigger = Sheet.Trigger;
const PageHandle = Sheet.Handle;
const PageOutlet = Sheet.Outlet;
const PageTitle = Sheet.Title;
const PageDescription = Sheet.Description;

// ================================================================================================
// Header
// ================================================================================================

type BackButtonMode =
  | { mode: "dismiss" }
  | { mode: "link"; as: React.ElementType; href: string };

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Back button config: dismiss sheet or link navigation */
  backButton?: BackButtonMode;
  /** Optional action element (right side) */
  action?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, backButton, action, ...restProps }, ref) => {
    const renderBackButton = () => {
      if (!backButton) return null;

      const buttonContent = (
        <>
          <ChevronLeft className="size-6" />
          <span className="sr-only">Back</span>
        </>
      );

      if (backButton.mode === "dismiss") {
        return (
          <PageTrigger action="dismiss" asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              {buttonContent}
            </Button>
          </PageTrigger>
        );
      }

      // Link mode - render as provided component
      const LinkComponent = backButton.as;
      return (
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <LinkComponent href={backButton.href}>{buttonContent}</LinkComponent>
        </Button>
      );
    };

    return (
      <header
        ref={ref}
        className={cn(
          "Page-header flex items-center justify-between px-4 py-3",
          className,
        )}
        {...restProps}
      >
        {/* Left: Back button */}
        <div className="flex min-w-10 items-center">{renderBackButton()}</div>

        {/* Center: Title & subtitle */}
        <div className="flex flex-1 flex-col items-center text-center">
          <PageTitle className="text-base font-semibold">{title}</PageTitle>
          {subtitle && (
            <PageDescription className="text-muted-foreground text-sm">
              {subtitle}
            </PageDescription>
          )}
        </div>

        {/* Right: Action */}
        <div className="flex min-w-10 items-center justify-end">{action}</div>
      </header>
    );
  },
);
PageHeader.displayName = "Page.Header";

export const Page = {
  Root: PageRoot,
  Portal: PagePortal,
  View: PageView,
  Backdrop: PageBackdrop,
  Content: PageContent,
  Trigger: PageTrigger,
  Handle: PageHandle,
  Outlet: PageOutlet,
  Title: PageTitle,
  Description: PageDescription,
  Header: PageHeader,
};
