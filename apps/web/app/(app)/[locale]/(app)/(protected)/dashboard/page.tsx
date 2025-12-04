"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Address, Avatar, Identity, Name } from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useConvexAuth } from "convex/react";
import { useTranslations } from "next-intl";
import { useAccount, useChainId } from "wagmi";

import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@myapp/ui/components/card";
import { Separator } from "@myapp/ui/components/separator";

import { authClient } from "@/auth/client";
import { useRouter } from "@/shared/i18n";

function InfoRow({
  label,
  value,
  isAccent = false,
}: {
  label: string;
  value: React.ReactNode;
  isAccent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
      <span
        className={`text-sm break-all ${isAccent ? "font-accent text-xs" : ""}`}
      >
        {value ?? <span className="text-muted-foreground italic">N/A</span>}
      </span>
    </div>
  );
}

export default function ProtectedPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { data: session } = authClient.useSession();
  const { address, isConnected, isConnecting, connector } = useAccount();
  const chainId = useChainId();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const router = useRouter();

  const loading = isAuthLoading || isConnecting;
  const user = session?.user;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="font-accent text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <Link href="/test">{t("to_test_page")}</Link>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-accent flex items-center gap-2">
            {t("auth_status.title")}
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated
                ? t("auth_status.authenticated")
                : t("auth_status.not_authenticated")}
            </Badge>
          </CardTitle>
          <CardDescription>{t("auth_status.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  setIsSigningOut(true);
                  await authClient.signOut();
                  router.push(`/login`);
                  // notify store so session hooks update
                  authClient.$store.notify("$sessionSignal");
                } catch (e) {
                  console.error("Sign out failed", e);
                } finally {
                  setIsSigningOut(false);
                }
              }}
              disabled={!isAuthenticated || isSigningOut}
            >
              {isSigningOut
                ? t("auth_status.signing_out")
                : t("auth_status.sign_out")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="font-accent">
              {t("user_profile.title")}
            </CardTitle>
            <CardDescription>{t("user_profile.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label={t("user_profile.user_id")}
                value={user.id}
                isAccent
              />
              <InfoRow label={t("user_profile.name")} value={user.name} />
              <InfoRow label={t("user_profile.email")} value={user.email} />
              <InfoRow
                label={t("user_profile.email_verified")}
                value={
                  user.emailVerified
                    ? t("user_profile.yes")
                    : t("user_profile.no")
                }
              />
            </div>
            {user.image && (
              <>
                <Separator />
                <InfoRow
                  label={t("user_profile.avatar")}
                  value={
                    <Image
                      src={user.image}
                      alt={t("user_profile.avatar")}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      {session?.session && (
        <Card>
          <CardHeader>
            <CardTitle>{t("session_details.title")}</CardTitle>
            <CardDescription>
              {t("session_details.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label={t("session_details.session_id")}
                value={session.session.id}
                isAccent
              />
              <InfoRow
                label={t("session_details.user_id")}
                value={session.session.userId}
                isAccent
              />
              <InfoRow
                label={t("session_details.token")}
                value={session.session.token}
                isAccent
              />
              <InfoRow
                label={t("session_details.created_at")}
                value={new Date(session.session.createdAt).toLocaleString()}
              />
              <InfoRow
                label={t("session_details.updated_at")}
                value={new Date(session.session.updatedAt).toLocaleString()}
              />
              <InfoRow
                label={t("session_details.expires_at")}
                value={new Date(session.session.expiresAt).toLocaleString()}
              />
            </div>
            {(session.session.ipAddress ?? session.session.userAgent) && (
              <>
                <Separator />
                <div className="grid gap-4">
                  <InfoRow
                    label={t("session_details.ip_address")}
                    value={session.session.ipAddress}
                    isAccent
                  />
                  <InfoRow
                    label={t("session_details.user_agent")}
                    value={session.session.userAgent}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("wallet.title")}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? t("wallet.connected") : t("wallet.disconnected")}
            </Badge>
          </CardTitle>
          <CardDescription>{t("wallet.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label={t("wallet.address")} value={address} isAccent />
            <InfoRow label={t("wallet.chain_id")} value={chainId} />
            <InfoRow label={t("wallet.connector")} value={connector?.name} />
          </div>
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address className="text-muted-foreground" />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </CardContent>
      </Card>

      {/* Raw Session Data */}
      <Card>
        <CardHeader>
          <CardTitle>{t("raw_data.title")}</CardTitle>
          <CardDescription>{t("raw_data.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted overflow-auto rounded-lg p-4 text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
