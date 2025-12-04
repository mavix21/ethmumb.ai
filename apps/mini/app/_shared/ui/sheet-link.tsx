"use client";

import type { Route } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SheetLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Route;
};

/**
 * A Link that automatically appends the current pathname as `?origin=`
 * so sheet routes can return to where the user came from.
 * Uses scroll={false} to preserve scroll position when opening sheets.
 */
export function SheetLink({ href, ...props }: SheetLinkProps) {
  const pathname = usePathname();
  const hrefWithOrigin =
    `${href}?origin=${encodeURIComponent(pathname)}` as Route;

  return <Link href={hrefWithOrigin} scroll={false} {...props} />;
}
