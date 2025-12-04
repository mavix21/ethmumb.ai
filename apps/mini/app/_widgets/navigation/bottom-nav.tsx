"use client";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Search, Users, Wallet } from "lucide-react";

import { Button } from "@myapp/ui/components/button";
import { cn } from "@myapp/ui/lib/utils";

import { PrimaryActionButton } from "./primary-action-button";

// ============================================================================
// Types
// ============================================================================

export interface NavItemConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  href: Route;
}

export interface PrimaryActionConfig {
  href: Route;
  className?: string;
}

export interface BottomNavProps {
  /** Navigation items to display */
  items?: NavItemConfig[];
  /** Primary action button config. If not provided, default FAB is shown */
  primaryAction?: PrimaryActionConfig;
  /** Whether to show the primary action FAB. Defaults to true */
  showPrimaryAction?: boolean;
  /** Additional class names for the nav container */
  className?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: "home", icon: Calendar, label: "Home", href: "/" as const },
  {
    id: "discover",
    icon: Search,
    label: "Discover",
    href: "/discover" as const,
  },
  {
    id: "community",
    icon: Users,
    label: "Community",
    href: "/community" as const,
  },
  {
    id: "collection",
    icon: Wallet,
    label: "Collection",
    href: "/collection" as const,
  },
];

const DEFAULT_PRIMARY_ACTION: PrimaryActionConfig = {
  href: "/article" as Route,
  className: "border-border/40 border-t shadow-2xl ring-6",
};

// ============================================================================
// Utilities
// ============================================================================

function isActiveRoute(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

// ============================================================================
// Components
// ============================================================================

interface NavItemProps extends NavItemConfig {
  isActive: boolean;
}

const NavItem = memo(function NavItem({
  icon: Icon,
  label,
  href,
  isActive,
}: NavItemProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn(
        "flex h-auto min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all duration-200",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-transparent",
      )}
    >
      <Link href={href} aria-current={isActive ? "page" : undefined}>
        <Icon
          className={cn(
            "size-5 transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "text-[10px] font-medium transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </Link>
    </Button>
  );
});

interface NavItemsGroupProps {
  items: NavItemConfig[];
  pathname: string;
}

const NavItemsGroup = memo(function NavItemsGroup({
  items,
  pathname,
}: NavItemsGroupProps) {
  return (
    <>
      {items.map((item) => (
        <NavItem
          key={item.id}
          {...item}
          isActive={isActiveRoute(item.href, pathname)}
        />
      ))}
    </>
  );
});

export function BottomNav({
  items = DEFAULT_NAV_ITEMS,
  primaryAction = DEFAULT_PRIMARY_ACTION,
  showPrimaryAction = true,
  className,
}: BottomNavProps) {
  const pathname = usePathname();

  // Split items for left/right sides when FAB is present
  const { leftItems, rightItems } = useMemo(() => {
    if (!showPrimaryAction) {
      return { leftItems: items, rightItems: [] };
    }

    const midpoint = Math.ceil(items.length / 2);
    return {
      leftItems: items.slice(0, midpoint),
      rightItems: items.slice(midpoint),
    };
  }, [items, showPrimaryAction]);

  return (
    <nav
      className={cn(
        "border-border/40 bg-card fixed right-0 -bottom-px left-0 z-1 border-t",
        className,
      )}
      aria-label="Main navigation"
    >
      <div className="relative px-2 py-2">
        <div className="flex items-center justify-around">
          {showPrimaryAction ? (
            <>
              {/* Left side items */}
              <div className="flex flex-1 items-center justify-around">
                <NavItemsGroup items={leftItems} pathname={pathname} />
              </div>

              {/* Spacer for FAB */}
              <div className="w-16 shrink-0" aria-hidden="true" />

              {/* Right side items */}
              <div className="flex flex-1 items-center justify-around">
                <NavItemsGroup items={rightItems} pathname={pathname} />
              </div>
            </>
          ) : (
            /* All items in a row when no FAB */
            <NavItemsGroup items={items} pathname={pathname} />
          )}
        </div>

        {/* Centered FAB */}
        {showPrimaryAction && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PrimaryActionButton
              href={primaryAction.href}
              className={primaryAction.className}
            />
          </div>
        )}
      </div>
    </nav>
  );
}
