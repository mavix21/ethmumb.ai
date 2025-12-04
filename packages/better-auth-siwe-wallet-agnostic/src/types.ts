import type { BetterAuthPlugin, InferOptionSchema } from "better-auth";

import type { schema } from "./schema";

/**
 * Arguments for ENS lookup function
 */
export interface ENSLookupArgs {
  /** The wallet address to look up */
  walletAddress: string;
}

/**
 * Result from ENS lookup function
 */
export interface ENSLookupResult {
  /** ENS name (e.g., "vitalik.eth") */
  name?: string;
  /** Avatar URL from ENS records */
  avatar?: string;
}

/**
 * Arguments passed to the verifyMessage function
 */
export interface VerifyMessageArgs {
  /** The raw SIWE message string that was signed */
  message: string;
  /** The signature from the wallet */
  signature: string;
  /** The wallet address (checksummed) */
  address: string;
  /** The chain ID from the SIWE message */
  chainId: number;
}

/**
 * Plugin options for SIWE-lite
 *
 * This plugin follows a similar pattern to the official Better Auth SIWE plugin,
 * delegating nonce generation, signature verification, and ENS lookup to the user.
 * This gives you full control over RPC configuration and external dependencies.
 *
 * Security-critical options:
 * - domain: REQUIRED - exact RFC 3986 authority (host[:port])
 * - uri: REQUIRED - exact URI that clients will use
 *
 * IMPORTANT: These values must EXACTLY match what the client sends.
 * There is no fuzzy matching - this is a security feature per EIP-4361.
 *
 * SECURITY NOTE: Rate limiting is NOT implemented in this plugin.
 * You MUST implement rate limiting at the infrastructure level.
 */
export interface SiweWalletAgnosticOptions {
  /**
   * Domain for SIWE message validation - RFC 3986 authority format.
   * REQUIRED: Must EXACTLY match `window.location.host` on the client.
   *
   * Per EIP-4361, this is the RFC 3986 "authority" which is host[:port].
   * - For standard ports (80/443), browsers omit the port: "myapp.com"
   * - For non-standard ports, include it: "localhost:3000"
   *
   * This prevents cross-domain replay attacks. An attacker cannot use
   * a SIWE message signed for "evil.com" to authenticate on "myapp.com".
   *
   * @example "myapp.com" for production (HTTPS on port 443)
   * @example "localhost:3000" for local development
   */
  domain: string;

  /**
   * Expected URI for SIWE message validation.
   * REQUIRED: Must EXACTLY match `window.location.origin` on the client.
   *
   * This is the full origin URL including protocol.
   * - For standard ports: "https://myapp.com"
   * - For non-standard ports: "http://localhost:3000"
   *
   * @example "https://myapp.com" for production
   * @example "http://localhost:3000" for local development
   */
  uri: string;

  /**
   * RPC URLs for each supported chain.
   * REQUIRED: Map of chain ID to RPC URL.
   *
   * Smart contract wallets (ERC-1271) and undeployed wallets (ERC-6492) require
   * chain-specific RPC calls for signature verification.
   *
   * For production, use dedicated RPC providers (Alchemy, Infura, QuickNode, etc.)
   * for better reliability and rate limits.
   *
   * @example
   * ```ts
   * chains: {
   *   1: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
   *   8453: "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
   *   137: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY",
   * }
   * ```
   */
  chains?: Record<number, string>;

  /**
   * Nonce expiration in seconds.
   * Lower values are more secure but may cause issues with slow connections.
   * @default 300 (5 minutes)
   */
  nonceExpiresInSeconds?: number;

  /**
   * Whether to allow anonymous sign-ins (wallet-only, no email required).
   *
   * When `true` (default): Users can sign in with just their wallet.
   * A placeholder email is generated: `{walletAddress}@{emailDomainName}`
   *
   * When `false`: Users MUST provide a valid email during sign-in.
   * This is useful for apps that need to contact users via email.
   * The verify endpoint will require an `email` field in the request body.
   *
   * @default true
   */
  anonymous?: boolean;

  /**
   * Email domain for creating user accounts.
   * Used to generate placeholder emails: `{walletAddress}@{emailDomainName}`
   * If not provided, falls back to `domain` or "wallet.local"
   *
   * @example "myapp.com" → "0x123...abc@myapp.com"
   */
  emailDomainName?: string;

  /**
   * Optional: ENS lookup function.
   * If provided, it will be called during user creation to resolve
   * the wallet's ENS name and avatar.
   *
   * Implementation is left to the user - you can use viem, ethers, or any other library.
   *
   * @example
   * ```ts
   * import { createPublicClient, http } from "viem";
   * import { mainnet } from "viem/chains";
   *
   * const client = createPublicClient({ chain: mainnet, transport: http() });
   *
   * ensLookup: async ({ walletAddress }) => {
   *   const name = await client.getEnsName({ address: walletAddress as `0x${string}` });
   *   const avatar = name ? await client.getEnsAvatar({ name }) : undefined;
   *   return { name: name ?? undefined, avatar: avatar ?? undefined };
   * }
   * ```
   */
  ensLookup?:
    | ((args: ENSLookupArgs) => Promise<ENSLookupResult | null | undefined>)
    | undefined;

  /**
   * Optional: Custom schema overrides.
   * Allows extending the default schema with additional fields.
   *
   * @example
   * ```ts
   * schema: {
   *   walletAddress: {
   *     fields: {
   *       label: { type: "string", required: false },
   *     },
   *   },
   * }
   * ```
   */
  schema?: InferOptionSchema<typeof schema> | undefined;
}

/**
 * Nonce record stored in database
 * Note: Nonces are deleted upon consumption (not marked as used)
 */
export interface NonceRecord {
  id: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Wallet address record stored in database
 */
export interface WalletAddress {
  id: string;
  userId: string;
  address: string;
  chainId: number;
  isPrimary: boolean;
  createdAt: Date;
}

/**
 * Verify request body
 */
export interface VerifyRequestBody {
  message: string;
  signature: string;
}

/**
 * Nonce response
 */
export interface NonceResponse {
  nonce: string;
}

/**
 * Verify response
 */
export interface VerifyResponse {
  user: {
    id: string;
    email: string;
    name: string;
    walletAddress: string;
  };
  session: {
    token: string;
  };
}

/**
 * Extended user type with wallet fields
 */
export interface SiweWalletAgnosticUser {
  walletAddress?: string | null;
}

/**
 * Extended account type
 */
export interface SiweWalletAgnosticAccount {
  walletAddress?: string | null;
  chainId?: number | null;
}

export type SiweWalletAgnosticPlugin = BetterAuthPlugin;
