"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

// Map of OAuth error codes to user-friendly messages
const errorMessages: Record<string, string> = {
  access_denied:
    "You denied access to your account. Please try again if you'd like to sign in.",
  invalid_request: "The sign-in request was invalid. Please try again.",
  unauthorized_client:
    "This application is not authorized. Please contact support.",
  unsupported_response_type: "An unexpected error occurred. Please try again.",
  invalid_scope: "An unexpected error occurred. Please try again.",
  server_error:
    "The authentication server encountered an error. Please try again later.",
  temporarily_unavailable:
    "The authentication service is temporarily unavailable. Please try again later.",
};

function OAuthErrorHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const hasHandledMessage = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Only handle message once to prevent loops
    if (error && !hasHandledMessage.current) {
      hasHandledMessage.current = true;

      // Get user-friendly message or use the description from the provider
      const message =
        errorMessages[error] ??
        errorDescription?.replace(/\+/g, " ") ??
        "An error occurred during sign in. Please try again.";

      // Delay toast to ensure Toaster component is fully mounted and ready
      // This prevents the abrupt appearance without animation
      requestAnimationFrame(() => {
        setTimeout(() => {
          toast.error("Sign in failed", {
            description: message,
            duration: 15000,
          });
        }, 50);
      });

      // Clean up URL by removing error params after toast is shown
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("error");
        newSearchParams.delete("error_description");

        const newUrl = newSearchParams.toString()
          ? `/${locale}/login?${newSearchParams.toString()}`
          : `/${locale}/login`;

        router.replace(newUrl, { scroll: false });
      }, 500);
    }
  }, [searchParams, router, locale]);

  return null;
}

export function OAuthErrorHandler() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorHandlerInner />
    </Suspense>
  );
}
