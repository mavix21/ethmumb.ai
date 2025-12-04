import type { BetterAuthClientPlugin } from "better-auth/client";

import type { siweWalletAgnostic } from "./index";

/**
 * Response types for client methods
 */
export interface NonceResponse {
  nonce: string;
}

export interface VerifyResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    walletAddress: string;
    chainId: number;
  };
}

export interface LinkWalletResponse {
  success: boolean;
  wallet: {
    address: string;
    chainId: number;
  };
}

export interface UnlinkWalletResponse {
  success: boolean;
}

export interface GetWalletsResponse {
  wallets: {
    id: string;
    address: string;
    chainId: number;
    isPrimary: boolean;
    createdAt: Date;
  }[];
}

/**
 * Input types for client methods
 */
export interface VerifyInput {
  message: string;
  signature: string;
  /**
   * Email address for the user.
   * Required when the server is configured with `anonymous: false`.
   * Optional when `anonymous: true` (default).
   */
  email?: string;
}

export interface LinkWalletInput {
  message: string;
  signature: string;
}

export interface UnlinkWalletInput {
  address: string;
}

type SiweWalletAgnosticPlugin = typeof siweWalletAgnostic;

/**
 * SIWE Wallet-Agnostic client plugin for Better Auth
 *
 * Provides typed client methods for SIWE authentication:
 * - getNonce(): Get a fresh nonce for SIWE message
 * - verify(): Verify signed SIWE message and create session
 * - linkWallet(): Link additional wallet to authenticated user
 * - unlinkWallet(): Remove a linked wallet
 * - getWallets(): Get all wallets linked to current user
 *
 * @example
 * ```ts
 * import { createAuthClient } from "better-auth/react";
 * import { siweWalletAgnosticClient } from "@nextjs-siwe-lite/siwe-wallet-agnostic/client";
 *
 * const authClient = createAuthClient({
 *   plugins: [siweWalletAgnosticClient()],
 * });
 *
 * // Get nonce
 * const { data: nonceData } = await authClient.siweWalletAgnostic.getNonce();
 *
 * // Verify signature
 * const { data, error } = await authClient.siweWalletAgnostic.verify({
 *   message: siweMessage,
 *   signature: signature,
 * });
 * ```
 */
export const siweWalletAgnosticClient = () => {
  return {
    id: "siwe-wallet-agnostic",
    $InferServerPlugin: {} as ReturnType<SiweWalletAgnosticPlugin>,
    getActions: ($fetch) => ({
      siweWalletAgnostic: {
        /**
         * Get a fresh nonce for SIWE message signing
         * The nonce expires after 5 minutes (configurable on server)
         *
         * @returns Promise with nonce string
         */
        getNonce: async () => {
          return await $fetch<NonceResponse>("/siwe-wallet-agnostic/nonce", {
            method: "GET",
          });
        },

        /**
         * Verify a signed SIWE message and create a session
         *
         * @param input - The signed message and signature
         * @param input.message - The prepared SIWE message string
         * @param input.signature - The signature from the wallet
         * @returns Promise with user info and session on success
         */
        verify: async (input: VerifyInput) => {
          return await $fetch<VerifyResponse>("/siwe-wallet-agnostic/verify", {
            method: "POST",
            body: input,
          });
        },

        /**
         * Link an additional wallet to the currently authenticated user
         * Requires an active session
         *
         * @param input - The signed message and signature for the new wallet
         * @returns Promise with linked wallet info
         */
        linkWallet: async (input: LinkWalletInput) => {
          return await $fetch<LinkWalletResponse>(
            "/siwe-wallet-agnostic/link",
            {
              method: "POST",
              body: input,
            },
          );
        },

        /**
         * Unlink a wallet from the currently authenticated user
         * Cannot unlink the primary wallet
         *
         * @param input - The wallet address to unlink
         * @returns Promise with success status
         */
        unlinkWallet: async (input: UnlinkWalletInput) => {
          return await $fetch<UnlinkWalletResponse>(
            "/siwe-wallet-agnostic/unlink",
            {
              method: "POST",
              body: input,
            },
          );
        },

        /**
         * Get all wallets linked to the currently authenticated user
         *
         * @returns Promise with array of wallet info
         */
        getWallets: async () => {
          return await $fetch<GetWalletsResponse>(
            "/siwe-wallet-agnostic/wallets",
            {
              method: "GET",
            },
          );
        },
      },
    }),
  } satisfies BetterAuthClientPlugin;
};

export default siweWalletAgnosticClient;
