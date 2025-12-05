"use client";

import Image from "next/image";
import { useAccount, useChainId } from "wagmi";

import { Badge } from "@ethmumb.ai/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ethmumb.ai/ui/components/card";
import { Separator } from "@ethmumb.ai/ui/components/separator";

import { useAuth } from "@/app/_contexts/auth-context";
import { useMiniApp } from "@/app/_contexts/miniapp-context";
import { authClient } from "@/auth/client";

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: session } = authClient.useSession();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { context: miniAppContext, isInMiniApp, isMiniAppReady } = useMiniApp();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="font-accent text-2xl font-bold">Auth Playground</h1>
        <p className="text-muted-foreground">
          This page displays your authentication details and session data.
        </p>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-accent flex items-center gap-2">
            Authentication Status
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </CardTitle>
          <CardDescription>Your current authentication state</CardDescription>
        </CardHeader>
      </Card>

      {/* User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="font-accent">User Profile</CardTitle>
            <CardDescription>
              Information from your authenticated session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="User ID" value={user.id} isAccent />
              <InfoRow label="Name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow
                label="Email Verified"
                value={user.emailVerified ? "Yes" : "No"}
              />
            </div>
            {user.image && (
              <>
                <Separator />
                <InfoRow
                  label="Avatar"
                  value={
                    <Image
                      src={user.image}
                      alt="User avatar"
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
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Technical details about your current session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Session ID" value={session.session.id} isAccent />
              <InfoRow
                label="User ID"
                value={session.session.userId}
                isAccent
              />
              <InfoRow label="Token" value={session.session.token} isAccent />
              <InfoRow
                label="Created At"
                value={new Date(session.session.createdAt).toLocaleString()}
              />
              <InfoRow
                label="Updated At"
                value={new Date(session.session.updatedAt).toLocaleString()}
              />
              <InfoRow
                label="Expires At"
                value={new Date(session.session.expiresAt).toLocaleString()}
              />
            </div>
            {(session.session.ipAddress ?? session.session.userAgent) && (
              <>
                <Separator />
                <div className="grid gap-4">
                  <InfoRow
                    label="IP Address"
                    value={session.session.ipAddress}
                    isAccent
                  />
                  <InfoRow
                    label="User Agent"
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
            Wallet Connection
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
          <CardDescription>Your connected wallet details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Address" value={address} isAccent />
            <InfoRow label="Chain ID" value={chainId} />
            <InfoRow label="Connector" value={connector?.name} />
          </div>
        </CardContent>
      </Card>

      {/* Mini App Context (Farcaster) */}
      {isInMiniApp && miniAppContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Farcaster Mini App
              <Badge variant={isMiniAppReady ? "default" : "secondary"}>
                {isMiniAppReady ? "Ready" : "Loading"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Farcaster Mini App context and user data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="FID" value={miniAppContext.user.fid} />
              <InfoRow label="Username" value={miniAppContext.user.username} />
              <InfoRow
                label="Display Name"
                value={miniAppContext.user.displayName}
              />
              <InfoRow
                label="Client FID"
                value={miniAppContext.client.clientFid}
              />
            </div>
            {miniAppContext.user.pfpUrl && (
              <>
                <Separator />
                <InfoRow
                  label="Profile Picture"
                  value={
                    <Image
                      src={miniAppContext.user.pfpUrl}
                      alt="Farcaster profile"
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

      {/* Raw Session Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Session Data</CardTitle>
          <CardDescription>
            Complete session object for debugging
          </CardDescription>
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
