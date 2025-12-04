import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createIntlMiddleware from "next-intl/middleware";

import { locales, routing } from "./app/_shared/i18n";

// Initialize the next-intl middleware
const handleI18nRouting = createIntlMiddleware(routing);

// Public pages that don't require authentication (without locale prefix)
const publicPages = ["/", "/login", "/register", "/about"];

// Routes that should redirect to dashboard if already authenticated (without locale prefix)
const authPages = ["/login", "/register"];

// Create a regex that matches public pages with optional locale prefix
const publicPathnameRegex = RegExp(
  `^(/(${locales.join("|")}))?(${publicPages.flatMap((p) => (p === "/" ? ["", "/"] : p)).join("|")})/?$`,
  "i",
);

// Create a regex that matches auth pages with optional locale prefix
const authPathnameRegex = RegExp(
  `^(/(${locales.join("|")}))?(${authPages.flatMap((p) => (p === "/" ? ["", "/"] : p)).join("|")})/?$`,
  "i",
);

/**
 * Gets the locale from the pathname or returns the default
 */
function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (
    firstSegment &&
    locales.includes(firstSegment as (typeof locales)[number])
  ) {
    return firstSegment;
  }
  return routing.defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the page is public
  const isPublicPage = publicPathnameRegex.test(pathname);

  // Check for session cookie (fast, no DB call)
  // NOTE: This only checks cookie existence, not validity.
  // Always validate the session in your pages/API routes for security.
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && authPathnameRegex.test(pathname)) {
    const locale = getLocaleFromPathname(pathname);
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // If it's a public page, just handle i18n routing
  if (isPublicPage) {
    return handleI18nRouting(request);
  }

  // For protected pages, check authentication
  if (!isAuthenticated) {
    const locale = getLocaleFromPathname(pathname);
    const signInUrl = new URL(`/${locale}/login`, request.url);
    // Store the original URL to redirect back after sign-in
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, handle i18n routing normally
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
