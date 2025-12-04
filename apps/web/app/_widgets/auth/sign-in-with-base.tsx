"use client";

import type { ProviderInterface } from "@base-org/account";
import * as React from "react";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useConnect } from "wagmi";

import { authClient } from "@/auth/client";
import { useRouter } from "@/shared/i18n";

/** Base chain ID in hex format */
const BASE_CHAIN_ID_HEX = "0x2105";

export function SignInWithBase() {
  const [nonce, setNonce] = React.useState<string | null>(null);
  const [, setIsLoading] = React.useState(false);
  const [, setIsNonceLoading] = React.useState(true);

  const { resolvedTheme } = useTheme();
  const { connectors } = useConnect();
  const router = useRouter();

  const baseAccountConnector = connectors.find(
    (connector) => connector.id === "baseAccount",
  );

  const handleSignInWithBase = React.useCallback(async () => {
    if (!baseAccountConnector) {
      console.error("Base Account connector not found");
      return;
    }

    let currentNonce = nonce;
    if (!currentNonce) {
      setIsLoading(true);
      try {
        const { data, error } = await authClient.siweWalletAgnostic.getNonce();
        if (error || !data.nonce) {
          throw new Error(error?.message ?? "Failed to get nonce");
        }
        currentNonce = data.nonce;
      } catch (e) {
        const error = e instanceof Error ? e : new Error("Failed to get nonce");
        toast.error(error.message);
        setIsLoading(false);

        return;
      }
    }

    setIsLoading(true);

    try {
      const provider =
        (await baseAccountConnector.getProvider()) as ProviderInterface;

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      });

      const result = await provider.request({
        method: "wallet_connect",
        params: [
          {
            version: "1",
            capabilities: {
              signInWithEthereum: {
                nonce: currentNonce,
                chainId: BASE_CHAIN_ID_HEX,
              },
            },
          },
        ],
      });

      // Extract the signed data from the response
      const { accounts } = result as {
        accounts: {
          address: string;
          capabilities: {
            signInWithEthereum: {
              message: string;
              signature: string;
            };
          };
        }[];
      };

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from Base wallet");
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { capabilities } = accounts[0]!;
      const { message, signature } = capabilities.signInWithEthereum;

      if (!message || !signature) {
        throw new Error("Missing message or signature from Base wallet");
      }

      const { data: verifyData, error: verifyError } =
        await authClient.siweWalletAgnostic.verify({
          message,
          signature,
        });

      if (verifyError) {
        throw new Error(verifyError.message ?? "Verification failed");
      }

      if (!verifyData.success) {
        throw new Error("Verification failed");
      }

      authClient.$store.notify("$sessionSignal");

      toast.success("Successfully signed in with Base!");

      // Fetch a new nonce for next time
      const { data } = await authClient.siweWalletAgnostic.getNonce();
      if (data?.nonce) {
        setNonce(data.nonce);
      }

      router.push("/dashboard");
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Failed to sign in");

      // Handle specific error cases
      if (
        error.message.includes("rejected") ||
        error.message.includes("denied")
      ) {
        toast.error("Sign-in was cancelled");
      } else if (error.message.includes("method_not_supported")) {
        toast.error(
          "This wallet doesn't support Sign in with Base. Please use a compatible wallet.",
        );
      } else {
        toast.error(error.message || "Failed to sign in");
      }

      // Fetch a new nonce since the current one might be consumed
      const { data } = await authClient.siweWalletAgnostic.getNonce();
      if (data?.nonce) {
        setNonce(data.nonce);
      }
    } finally {
      setIsLoading(false);
    }
  }, [baseAccountConnector, nonce, router]);

  React.useEffect(() => {
    let mounted = true;

    const fetchNonce = async () => {
      try {
        const { data, error } = await authClient.siweWalletAgnostic.getNonce();
        if (error || !data.nonce) {
          return;
        }
        if (mounted) {
          setNonce(data.nonce);
        }
      } finally {
        if (mounted) {
          setIsNonceLoading(false);
        }
      }
    };

    void fetchNonce();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SignInWithBaseButton
      align="center"
      variant="solid"
      colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
      onClick={handleSignInWithBase}
    />
  );
}
