"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  LoadingButton,
  LoadingButtonContent,
} from "@myapp/ui/components/loading-button";

import { authClient } from "@/auth/client";

interface SignInWithGitHubProps {
  className?: string;
}

export function SignInWithGitHub({ className }: SignInWithGitHubProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("auth");

  // Get the callback URL from query params (set by proxy when redirecting to login)
  // Fall back to localized dashboard with success indicator
  const callbackUrl = React.useMemo(
    () => searchParams.get("callbackUrl") ?? `/${locale}/dashboard`,
    [searchParams, locale],
  );

  const handleSignInWithGitHub = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
        errorCallbackURL: `/${locale}/login`,
      });

      if (error) {
        toast.error(error.message ?? t("errors.github_signin_failed"));
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [callbackUrl, locale, t]);

  return (
    <LoadingButton
      size="lg"
      variant="outline"
      type="button"
      className={className}
      onClick={handleSignInWithGitHub}
      isLoading={isLoading}
    >
      <LoadingButtonContent loadingText={t("signing_in")}>
        <GitHubIcon />
        {t("sign_in_with_github")}
      </LoadingButtonContent>
    </LoadingButton>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
    >
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        fill="currentColor"
      />
    </svg>
  );
}
