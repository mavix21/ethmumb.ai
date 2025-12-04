"use client";

import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@myapp/ui/components/button";
import { cn } from "@myapp/ui/lib/utils";

import { SheetLink } from "@/shared/ui/sheet-link";

interface MainNavButtonProps {
  href: Route;
  className?: string;
}

export function PrimaryActionButton({ className, href }: MainNavButtonProps) {
  return (
    <Button
      size="icon"
      className={cn(
        "bg-primary hover:bg-primary/90 shadow-primary/25 right-6 bottom-28 z-40 size-14 rounded-full shadow-xl transition-all duration-200 hover:scale-105 active:scale-95",
        className,
      )}
      asChild
    >
      <SheetLink href={href}>
        <Plus className="text-primary-foreground size-5" />
        <span className="sr-only">Main Navigation</span>
      </SheetLink>
    </Button>
  );
}
