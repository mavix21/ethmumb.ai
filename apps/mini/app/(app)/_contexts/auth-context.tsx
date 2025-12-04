"use client";

import * as React from "react";
import {
  sdk as miniappSdk,
  SignIn as SignInCore,
} from "@farcaster/miniapp-sdk";
import { SiweMessage } from "siwe";
import { base } from "viem/chains";
import { useAccount, useSignMessage } from "wagmi";

import type { Session } from "@myapp/auth";

import { authClient } from "@/auth/client";

import { useMiniApp } from "./miniapp-context";

interface AuthContextType {
  user: Session["user"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { context: miniAppContext, isMiniAppReady, isInMiniApp } = useMiniApp();
  const {
    data: session,
    isPending: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = authClient.useSession();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<Error | null>(null);

  const clearError = React.useCallback(() => setAuthError(null), []);

  const signInWithSiwe = React.useCallback(async () => {
    if (!address) throw new Error("No wallet address available");

    const { data, error } = await authClient.siwe.nonce({
      walletAddress: address,
      chainId: base.id,
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (error || !data)
      throw new Error("Failed to get nonce for SIWE", { cause: error });

    const message = new SiweMessage({
      domain: window.location.host,
      address,
      chainId: base.id,
      uri: window.location.origin,
      version: "1",
      statement: "Sign in with Ethereum to access your account",
      nonce: data.nonce,
      issuedAt: new Date().toISOString(),
    }).prepareMessage();

    const signature = await signMessageAsync({ message });

    const { error: verifyError } = await authClient.siwe.verify({
      message,
      signature,
      walletAddress: address,
      chainId: base.id,
    });

    if (verifyError)
      throw new Error("SIWE verification failed", { cause: verifyError });
  }, [address, signMessageAsync]);

  const signInWithFarcaster = React.useCallback(async () => {
    if (!miniAppContext) throw new Error("Mini App context not available");

    const { token } = await miniappSdk.quickAuth.getToken();

    const response = await authClient.signInWithFarcaster({
      token,
      user: {
        fid: miniAppContext.user.fid,
        username: miniAppContext.user.username,
        displayName: miniAppContext.user.displayName,
        pfpUrl: miniAppContext.user.pfpUrl,
        notificationDetails: miniAppContext.client.notificationDetails
          ? [
              {
                ...miniAppContext.client.notificationDetails,
                appFid: miniAppContext.client.clientFid,
              },
            ]
          : [],
      },
    });

    if (
      !(response.data && "success" in response.data && response.data.success)
    ) {
      throw new Error("Sign-in verification failed");
    }
  }, [miniAppContext]);

  const signIn = React.useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      await (miniAppContext ? signInWithFarcaster() : signInWithSiwe());
      refetchSession();
    } catch (err) {
      const error =
        err instanceof SignInCore.RejectedByUser
          ? new Error("Sign-in rejected by user")
          : err instanceof Error
            ? err
            : new Error("Sign-in failed");
      setAuthError(error);
    } finally {
      setIsSigningIn(false);
    }
  }, [miniAppContext, signInWithFarcaster, signInWithSiwe, refetchSession]);

  const user = session?.user ?? null;
  const isLoading =
    isSessionLoading || (isInMiniApp && !isMiniAppReady) || isSigningIn;

  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      error: authError ?? sessionError ?? null,
      isAuthenticated: !!user,
      signIn,
      clearError,
    }),
    [user, isLoading, authError, sessionError, signIn, clearError],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.use(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
