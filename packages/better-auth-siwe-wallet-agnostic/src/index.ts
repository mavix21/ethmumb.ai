import type { AuthContext, BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { generateRandomString } from "better-auth/crypto";
import { mergeSchema } from "better-auth/db";
import { SiweMessage } from "siwe";
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  isHex,
  recoverMessageAddress,
  size,
} from "viem";
import { z } from "zod";

import type {
  NonceRecord,
  SiweWalletAgnosticOptions,
  WalletAddress,
} from "./types";
import { schema } from "./schema";

// Re-export types and schema
export * from "./types";
export { schema } from "./schema";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_NONCE_EXPIRY_SECONDS = 300; // 5 minutes
const NONCE_CLEANUP_PROBABILITY = 0.25; // 25% chance to run cleanup on nonce generation
const MAX_CHAIN_ID = 2147483647; // Max 32-bit signed integer
const NONCE_LENGTH = 32; // 32 alphanumeric characters
const MIN_SIGNATURE_SIZE = 65; // ECDSA signature size in bytes
const MAX_SIGNATURE_SIZE = 32768; // 32KB max - generous for ERC-6492 while preventing abuse

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate cryptographically secure random nonce using Better Auth's
 * battle-tested implementation.
 *
 * Uses 32 alphanumeric characters for ~190 bits of entropy,
 * which exceeds SIWE's minimum requirement of 8 characters.
 *
 * IMPORTANT: We explicitly specify alphanumeric characters only (a-z, A-Z, 0-9)
 * because the default includes "-" and "_" which can cause SIWE parsing issues.
 */
function generateNonce(): string {
  return generateRandomString(NONCE_LENGTH, "a-z", "A-Z", "0-9");
}

/**
 * Convert wallet address to EIP-55 checksummed format for storage.
 *
 * IMPORTANT: We use checksummed addresses for compatibility with the official
 * Better Auth SIWE plugin. This ensures:
 * 1. Data portability between plugins
 * 2. Consistent lookups across different database adapters
 * 3. Proper EIP-55 checksum validation on retrieval
 *
 * The checksummed format uses Keccak-256 hashing to determine case,
 * providing built-in error detection for address typos.
 *
 * @param address - A valid Ethereum address (any case)
 * @returns The address in EIP-55 checksummed format
 * @throws Error if the address is invalid
 */
function toChecksummedAddress(address: string): string {
  try {
    // viem's getAddress validates and returns checksummed format
    return getAddress(address);
  } catch {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

/**
 * Validate wallet address format using viem's isAddress
 * Uses viem's battle-tested validation (handles checksums, length, format)
 */
function isValidWalletAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Validate Ethereum signature format using viem utilities
 * - Must be valid hex string
 * - Must be at least 65 bytes (ECDSA: r=32 + s=32 + v=1)
 * - ERC-6492 signatures can be longer (include deployment bytecode)
 * - Must not exceed 100KB to prevent DoS attacks
 */
function isValidSignature(signature: string): boolean {
  if (!isHex(signature, { strict: true })) return false;
  const sigSize = size(signature);
  return sigSize >= MIN_SIGNATURE_SIZE && sigSize <= MAX_SIGNATURE_SIZE;
}

/**
 * Validate nonce format
 * - Must be alphanumeric characters only
 * - Must be at least 8 characters (SIWE spec minimum)
 * - Must not exceed 64 characters (reasonable max)
 */
function isValidNonce(nonce: string): boolean {
  if (typeof nonce !== "string") return false;
  // SIWE spec requires minimum 8 alphanumeric characters
  // We allow up to 64 for flexibility
  if (nonce.length < 8 || nonce.length > 64) return false;
  // Check all characters are alphanumeric
  for (let i = 0; i < nonce.length; i++) {
    const code = nonce.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57; // 0-9
    const isUpper = code >= 65 && code <= 90; // A-Z
    const isLower = code >= 97 && code <= 122; // a-z
    if (!isDigit && !isUpper && !isLower) return false;
  }
  return true;
}

/**
 * Parsed message fields - common interface for both standard SIWE and simplified formats
 */
interface ParsedMessageFields {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  chainId: number;
  version?: string;
  statement?: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
}

/**
 * Parse SIWE-like message with fallback for simplified formats (like Base SDK)
 *
 * First attempts standard SIWE parsing via the siwe package's ABNF parser.
 * If that fails, falls back to regex extraction for simplified formats.
 *
 * Base SDK returns a simplified format missing Version and Issued At fields,
 * which is valid for signature verification but not EIP-4361 compliant.
 * Their docs recommend using regex extraction: message.match(/Nonce: (\w+)/)
 *
 * @see https://docs.base.org/identity/smart-wallet/guides/siwe
 */
function parseMessage(message: string): ParsedMessageFields {
  // Try standard SIWE parsing first
  try {
    const siweMessage = new SiweMessage(message);
    return {
      domain: siweMessage.domain,
      address: siweMessage.address,
      uri: siweMessage.uri,
      nonce: siweMessage.nonce,
      chainId: siweMessage.chainId,
      version: siweMessage.version,
      statement: siweMessage.statement,
      issuedAt: siweMessage.issuedAt,
      expirationTime: siweMessage.expirationTime,
      notBefore: siweMessage.notBefore,
      requestId: siweMessage.requestId,
    };
  } catch {
    // Fall back to regex extraction for simplified formats (Base SDK, etc.)
    // These regexes match the exact field format in SIWE-like messages
    const domainMatch = /^(?:https?:\/\/)?([^\s]+) wants you to sign in/.exec(
      message,
    );
    const addressMatch = /account:\n(0x[a-fA-F0-9]{40})/.exec(message);
    const uriMatch = /URI: ([^\n]+)/.exec(message);
    const nonceMatch = /Nonce: ([a-zA-Z0-9]+)/.exec(message);
    const chainIdMatch = /Chain ID: (\d+)/.exec(message);
    const versionMatch = /Version: (\d+)/.exec(message);
    const issuedAtMatch = /Issued At: ([^\n]+)/.exec(message);
    const expirationTimeMatch = /Expiration Time: ([^\n]+)/.exec(message);
    const notBeforeMatch = /Not Before: ([^\n]+)/.exec(message);
    const requestIdMatch = /Request ID: ([^\n]+)/.exec(message);

    // Extract statement (text between address and URI line, if present)
    // Using [\s\S] instead of /s flag for ES5 compatibility
    const statementMatch = /0x[a-fA-F0-9]{40}\n\n([\s\S]+?)\n\nURI:/.exec(
      message,
    );

    const domain = domainMatch?.[1];
    const address = addressMatch?.[1];
    const uri = uriMatch?.[1];
    const nonce = nonceMatch?.[1];
    const chainId = chainIdMatch?.[1];

    if (!domain || !address || !uri || !nonce || !chainId) {
      throw new Error(
        `Invalid message format: missing required fields. ` +
          `Got domain=${!!domain}, address=${!!address}, uri=${!!uri}, nonce=${!!nonce}, chainId=${!!chainId}`,
      );
    }

    return {
      domain,
      address,
      uri,
      nonce,
      chainId: parseInt(chainId, 10),
      version: versionMatch?.[1],
      statement: statementMatch?.[1],
      issuedAt: issuedAtMatch?.[1],
      expirationTime: expirationTimeMatch?.[1],
      notBefore: notBeforeMatch?.[1],
      requestId: requestIdMatch?.[1],
    };
  }
}

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

/**
 * Base verify body schema - email is optional here.
 * When anonymous=false, we add runtime validation to require email.
 */
const baseVerifyBodySchema = z.object({
  message: z.string().min(1, "Message is required"),
  signature: z
    .string()
    .min(1, "Signature is required")
    .refine(isValidSignature, "Invalid signature format"),
  email: z.string().email("Invalid email format").optional(),
});

/**
 * Create verify body schema based on anonymous option.
 * When anonymous=false, email is required.
 */
function createVerifyBodySchema(anonymous: boolean) {
  if (anonymous) {
    return baseVerifyBodySchema;
  }
  // When not anonymous, email is required
  return baseVerifyBodySchema.refine((data) => !!data.email, {
    message: "Email is required when anonymous sign-in is disabled",
    path: ["email"],
  });
}

const unlinkBodySchema = z.object({
  address: z
    .string()
    .length(42, "Wallet address must be 42 characters")
    .refine(isValidWalletAddress, "Invalid wallet address format"),
});

/**
 * Schema for link wallet endpoint - email not needed
 */
const linkWalletBodySchema = z.object({
  message: z.string().min(1, "Message is required"),
  signature: z
    .string()
    .min(1, "Signature is required")
    .refine(isValidSignature, "Invalid signature format"),
});

// ============================================================================
// Plugin Implementation
// ============================================================================

/**
 * SIWE Wallet-Agnostic plugin for Better Auth
 *
 * Supports ALL EVM-compatible chains (mainnets and testnets) out of the box.
 * Use `allowedChainIds` option to restrict which chains are accepted.
 *
 * Supports ERC-6492 (undeployed contract wallets) by not requiring
 * wallet address upfront for nonce generation.
 *
 * Chain-agnostic verification:
 * - For EOA wallets: Pure ECDSA signature recovery (no RPC needed)
 * - For Smart Contract wallets: Uses ERC-6492 verification
 * - The chainId is embedded in the SIWE message and validated
 *
 * Security features:
 * - Domain validation against SIWE message (prevents cross-domain replay)
 * - URI validation (ensures message was intended for your app)
 * - Atomic nonce consumption (prevents race conditions)
 * - SIWE message expiration validation
 * - Proper EIP-55 checksum using Keccak-256 via viem
 *
 * Flow:
 * 1. Client requests nonce (no wallet needed)
 * 2. Client creates SIWE message with nonce
 * 3. Client signs message (ERC-6492 compatible)
 * 4. Client sends message + signature to verify
 * 5. Server validates nonce, domain, URI, expiration, verifies signature
 * 6. Server atomically consumes nonce and creates session
 *
 * IMPORTANT: Rate limiting is NOT implemented in this plugin.
 * You MUST implement rate limiting at the infrastructure level (API gateway,
 * middleware, or reverse proxy) to prevent:
 * - Nonce flooding attacks (DoS via database exhaustion)
 * - Brute force signature attempts
 * Recommended: Limit nonce requests to 10-20 per minute per IP.
 */
export const siweWalletAgnostic = (
  options: SiweWalletAgnosticOptions,
): BetterAuthPlugin => {
  // Validate required security parameters at initialization
  if (!options.domain) {
    throw new Error(
      "[siwe-wallet-agnostic] SECURITY ERROR: 'domain' is required. This prevents cross-domain replay attacks.",
    );
  }
  if (!options.uri) {
    throw new Error(
      "[siwe-wallet-agnostic] SECURITY ERROR: 'uri' is required. This ensures messages were intended for your application.",
    );
  }
  if (!options.chains || Object.keys(options.chains).length === 0) {
    throw new Error(
      "[siwe-wallet-agnostic] 'chains' is required. Provide a Record<chainId, rpcUrl> for signature verification.",
    );
  }

  const {
    domain,
    uri,
    chains,
    nonceExpiresInSeconds = DEFAULT_NONCE_EXPIRY_SECONDS,
    anonymous = true,
    emailDomainName,
    ensLookup,
    schema: customSchema,
  } = options;

  // Create verify body schema based on anonymous option
  const verifyBodySchema = createVerifyBodySchema(anonymous);

  // Validate domain format (no protocol, just hostname)
  if (domain.includes("://")) {
    throw new Error(
      "[siwe-wallet-agnostic] 'domain' should be a hostname without protocol (e.g., 'myapp.com' not 'https://myapp.com')",
    );
  }

  // Validate URI format (must have protocol)
  if (!uri.startsWith("http://") && !uri.startsWith("https://")) {
    throw new Error(
      "[siwe-wallet-agnostic] 'uri' must include protocol (e.g., 'https://myapp.com')",
    );
  }

  /**
   * Get email domain for generating placeholder emails.
   *
   * Strips port from domain because:
   * 1. Ports are not valid in email domains (RFC 5321)
   * 2. Port changes (dev vs prod, port migrations) shouldn't create duplicate users
   *
   * Priority: emailDomainName option > domain hostname > "wallet.local"
   */
  function getEmailDomain(): string {
    if (emailDomainName) {
      return emailDomainName;
    }
    // Strip port from domain (e.g., "localhost:3001" → "localhost")
    return domain.split(":")[0] || "wallet.local";
  }

  /**
   * Get a public client for signature verification (smart wallets only)
   *
   * Returns undefined if the chain is not configured.
   * This is fine for EOA wallets which don't need RPC.
   */
  function getPublicClientForVerification(chainId: number) {
    const rpcUrl = chains[chainId];
    if (!rpcUrl) {
      return undefined;
    }
    return createPublicClient({
      // chain: mainnet,
      transport: http(rpcUrl),
    });
  }

  /**
   * Validate chain ID format (any valid EVM chain ID is allowed)
   *
   * We allow ANY chain ID because EOA signature verification is chain-agnostic.
   * Smart wallet verification will only work for chains configured in `chains`.
   */
  function validateChainId(chainId: number): void {
    // Validate chain ID is a positive integer within bounds
    if (!Number.isInteger(chainId) || chainId < 1 || chainId > MAX_CHAIN_ID) {
      throw new APIError("BAD_REQUEST", {
        message: "Invalid chain ID",
      });
    }
    // Note: We don't restrict to configured chains here.
    // EOA wallets work on any chain (ECDSA is chain-agnostic).
    // Smart wallets will fail verification if chain is not configured.
  }

  /**
   * Validate SIWE message security fields
   * This is CRITICAL for preventing replay attacks
   *
   * Per EIP-4361, domain is the RFC 3986 authority (host with optional port).
   *
   * Domain validation strategy:
   * - If message includes a port: require EXACT match (strictest)
   * - If message omits port (Base SDK behavior): hostname must match exactly
   *
   * Known limitation: Base SDK strips the port from the domain, so we cannot
   * verify the port when the message lacks it. This is acceptable because:
   * 1. The URI validation below still checks the full origin
   * 2. The hostname match prevents cross-domain attacks
   * 3. Port-based attacks would require controlling the same hostname
   */
  function validateMessageSecurity(parsedMessage: ParsedMessageFields): void {
    // 1. Domain validation
    const configuredHost = domain.split(":")[0];
    const configuredPort = domain.split(":")[1]; // undefined if no port
    const messageHost = parsedMessage.domain.split(":")[0];
    const messagePort = parsedMessage.domain.split(":")[1]; // undefined if no port

    // Hostname MUST always match exactly
    if (messageHost !== configuredHost) {
      throw new APIError("UNAUTHORIZED", {
        message: "SIWE message domain mismatch",
      });
    }

    // If message includes a port, it MUST match configured port exactly
    // (If configured has no port, message shouldn't have one either)
    if (messagePort !== undefined) {
      if (messagePort !== configuredPort) {
        throw new APIError("UNAUTHORIZED", {
          message: "SIWE message domain mismatch",
        });
      }
    }
    // If message omits port (Base SDK), we accept it - hostname match is sufficient
    // The URI check below provides additional validation

    // 2. URI validation - compare origin (protocol + host)
    // Some wallets may include or exclude the port differently
    const configuredOrigin = new URL(uri).origin;
    const messageOrigin = new URL(parsedMessage.uri).origin;

    if (messageOrigin !== configuredOrigin) {
      throw new APIError("UNAUTHORIZED", {
        message: "SIWE message URI mismatch",
      });
    }

    // 3. Validate version is supported (only version 1 exists per EIP-4361)
    // Note: Some wallets (like Base) may omit version, so we allow undefined
    if (parsedMessage.version && parsedMessage.version !== "1") {
      throw new APIError("BAD_REQUEST", {
        message: "Unsupported SIWE message version",
      });
    }

    // 4. Validate expirationTime if present
    if (parsedMessage.expirationTime) {
      const expiration = new Date(parsedMessage.expirationTime);
      if (isNaN(expiration.getTime())) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid expiration time format",
        });
      }
      if (new Date() > expiration) {
        throw new APIError("UNAUTHORIZED", {
          message: "SIWE message has expired",
        });
      }
    }

    // 5. Validate notBefore if present
    if (parsedMessage.notBefore) {
      const notBefore = new Date(parsedMessage.notBefore);
      if (isNaN(notBefore.getTime())) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid notBefore time format",
        });
      }
      if (new Date() < notBefore) {
        throw new APIError("UNAUTHORIZED", {
          message: "SIWE message is not yet valid",
        });
      }
    }

    // 6. Validate issuedAt is reasonable (not too far in the future)
    if (parsedMessage.issuedAt) {
      const issuedAt = new Date(parsedMessage.issuedAt);
      if (isNaN(issuedAt.getTime())) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid issuedAt time format",
        });
      }
      // Allow 5 minutes clock skew
      const futureLimit = new Date(Date.now() + 5 * 60 * 1000);
      if (issuedAt > futureLimit) {
        throw new APIError("BAD_REQUEST", {
          message: "SIWE message issuedAt is too far in the future",
        });
      }
    }

    // 7. Validate requestId format if present (optional per EIP-4361)
    // requestId can be used for additional replay protection or request correlation
    if (
      parsedMessage.requestId !== undefined &&
      parsedMessage.requestId !== null
    ) {
      // requestId should be a non-empty string if provided
      if (
        typeof parsedMessage.requestId !== "string" ||
        parsedMessage.requestId.length === 0 ||
        parsedMessage.requestId.length > 256 // Reasonable max length
      ) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid requestId format",
        });
      }
    }
  }

  /**
   * Atomically validate and consume nonce using single-query delete approach.
   *
   * SECURITY ARCHITECTURE:
   * This function uses a TRUE atomic operation - a single DELETE query with
   * all validation conditions in the WHERE clause. This eliminates TOCTOU
   * (Time-of-Check to Time-of-Use) vulnerabilities entirely.
   *
   * How it works:
   * 1. Single DELETE query: WHERE value = ? AND expiresAt > NOW()
   * 2. Check affected row count: count > 0 means WE consumed it
   * 3. count === 0 means either: nonce doesn't exist, already consumed, or expired
   *
   * Why this is race-condition-proof:
   * - Database DELETE is atomic at the row level
   * - Two concurrent DELETEs on the same row: only ONE gets count=1
   * - The other gets count=0 and is rejected
   * - No window between "check" and "use" - they're the same operation
   *
   * IMPORTANT: This function is called AFTER signature verification.
   * This order prevents "nonce exhaustion attacks" where attackers could
   * waste legitimate users' nonces by submitting invalid signatures.
   * Since signature verification proves wallet ownership, only the legitimate
   * wallet owner can trigger nonce consumption.
   *
   * Adapter compatibility:
   * - Drizzle: returns { count: number } via rowCount/affectedRows/changes
   * - Kysely: returns array length as count
   * - MongoDB: returns { deletedCount: number }
   * - Memory adapter: returns { count: number }
   *
   * @throws APIError("UNAUTHORIZED") if nonce is invalid, expired, or already consumed
   */
  async function validateAndConsumeNonce(
    adapter: AuthContext["adapter"],
    nonceValue: string,
  ): Promise<void> {
    // Use a generic error message for all nonce failures to prevent information leakage
    const nonceError = new APIError("UNAUTHORIZED", {
      message: "Invalid or expired nonce",
    });

    // SECURITY: Validate nonce format before DB query (defense in depth)
    // This prevents potential SQL injection or NoSQL injection via malformed nonces
    if (!isValidNonce(nonceValue)) {
      throw nonceError;
    }

    // ATOMIC CONSUMPTION: Single DELETE with all conditions in WHERE clause
    // This is the ONLY database operation - no find-then-delete pattern
    //
    // The WHERE clause combines:
    // 1. value = nonceValue (exact match)
    // 2. expiresAt > now (not expired)
    //
    // If deleteMany is available (recommended), we get the count of deleted rows.
    // If count === 1, we successfully consumed the nonce atomically.
    // If count === 0, the nonce was invalid, expired, or already consumed.

    const now = new Date();

    // Check if deleteMany is available (required for atomic consumption)
    if (typeof adapter.deleteMany !== "function") {
      // CRITICAL: deleteMany is required for atomic nonce consumption
      // Without it, we cannot guarantee race-condition-free operation
      //
      // Fallback strategy: Use find-then-delete with explicit warning
      // This is NOT race-safe but allows the plugin to function with limited adapters
      console.warn(
        "[siwe-wallet-agnostic] WARNING: Your database adapter does not support deleteMany. " +
          "Nonce consumption is NOT fully atomic and may be vulnerable to race conditions. " +
          "For production use, please use an adapter that supports deleteMany " +
          "(Drizzle, Kysely, MongoDB, or Prisma adapters all support this).",
      );

      // Fallback: find-then-delete (NOT ATOMIC - last resort only)
      const nonceRecord: NonceRecord | null = await adapter.findOne({
        model: "nonce",
        where: [{ field: "value", value: nonceValue }],
      });

      if (!nonceRecord) {
        throw nonceError;
      }

      if (new Date(nonceRecord.expiresAt) <= now) {
        // Clean up expired nonce (best effort)
        adapter
          .delete({
            model: "nonce",
            where: [{ field: "id", value: nonceRecord.id }],
          })
          .catch(() => {});
        throw nonceError;
      }

      // Delete by ID - not atomic but best we can do
      await adapter.delete({
        model: "nonce",
        where: [{ field: "id", value: nonceRecord.id }],
      });

      return;
    }

    // PRIMARY PATH: Atomic delete with count verification
    //
    // This single query does everything atomically:
    // - Finds the nonce by value
    // - Verifies it's not expired
    // - Deletes it
    // - Returns how many rows were affected
    //
    // Only ONE concurrent request can get count > 0 for the same nonce.
    const deleteResult = await adapter.deleteMany({
      model: "nonce",
      where: [
        { field: "value", operator: "eq", value: nonceValue },
        { field: "expiresAt", operator: "gt", value: now },
      ],
    });

    // Normalize the result - different adapters return count differently
    // - Drizzle/Prisma: returns number directly or { count: number }
    // - Kysely: returns number (array length)
    // - MongoDB: returns number (deletedCount)
    // - Some adapters might return the count wrapped in an object
    let deletedCount: number;

    if (typeof deleteResult === "number") {
      deletedCount = deleteResult;
      // } else if ("count" in deleteResult) {
      //   // Handle { count: number } or { deletedCount: number } formats
      //   deletedCount = deleteResult.count ?? deleteResult.deletedCount ?? 0;
    } else {
      // Unexpected format - treat as failure for safety
      console.error(
        "[siwe-wallet-agnostic] Unexpected deleteMany result format:",
        deleteResult,
      );
      deletedCount = 0;
    }

    // THE CRITICAL CHECK: Did WE delete exactly one nonce?
    if (deletedCount === 0) {
      // Nonce was either:
      // 1. Never existed (invalid nonce value)
      // 2. Already consumed by another request (race condition - we lost)
      // 3. Expired (expiresAt <= now)
      //
      // We use the same generic error for all cases to prevent information leakage
      throw nonceError;
    }

    // SUCCESS: We atomically consumed the nonce
    // deletedCount should be exactly 1 (nonce values are unique)
    // If it's > 1, something is very wrong with the data, but we proceed anyway
    if (deletedCount > 1) {
      console.warn(
        `[siwe-wallet-agnostic] Unexpected: deleteMany removed ${deletedCount} nonces for value. ` +
          "This suggests duplicate nonce values in the database.",
      );
    }

    // Nonce successfully consumed - caller can proceed with signature verification
    return;
  }

  /**
   * Verify message signature
   *
   * Strategy:
   * 1. Try EOA verification first (pure ECDSA recovery - no RPC needed)
   *    This works for ANY EVM chain since ECDSA is chain-agnostic.
   *
   * 2. If EOA verification fails AND chain is configured, try smart wallet verification
   *    This uses RPC to call ERC-1271 isValidSignature() or ERC-6492 for undeployed wallets.
   *
   * This makes the plugin a superset of standard SIWE:
   * - EOA wallets work on ANY chain (Celo, any EVM chain)
   * - Smart wallets require the chain to be in the `chains` config
   *
   * @param chainId - The chain ID for smart wallet verification (ERC-1271/6492)
   * @throws APIError if signature is invalid
   */
  async function verifySignature(
    message: string,
    signature: string,
    address: string,
    chainId: number,
  ): Promise<void> {
    const normalizedAddress = getAddress(address);
    const sig = signature as `0x${string}`;

    // 1. Try EOA verification first (pure ECDSA - works on any chain)
    try {
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: sig,
      });
      console.log(
        "[siwe-wallet-agnostic] Recovered address:",
        recoveredAddress,
      );

      if (getAddress(recoveredAddress) === normalizedAddress) {
        // EOA signature is valid!
        return;
      }
    } catch {
      // ECDSA recovery failed - might be a smart wallet signature
      console.warn(
        "[siwe-wallet-agnostic] EOA signature verification failed, trying smart wallet verification",
      );
    }

    // 2. If EOA failed, try smart wallet verification (requires RPC)
    const publicClient = getPublicClientForVerification(chainId);

    if (!publicClient) {
      // Chain not configured and EOA verification failed
      // This is likely a smart wallet on an unconfigured chain
      throw new APIError("BAD_REQUEST", {
        message: `Smart wallet verification requires chain ${chainId} to be configured`,
      });
    }

    try {
      // verifyMessage handles ERC-1271 and ERC-6492
      const isValid = await publicClient.verifyMessage({
        address: normalizedAddress,
        message,
        signature: sig,
      });

      if (!isValid) {
        throw new APIError("UNAUTHORIZED", {
          message: "Invalid signature",
        });
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError("UNAUTHORIZED", {
        message: "Signature verification failed",
      });
    }
  }

  /**
   * Result of wallet/account creation attempt
   */
  interface CreateWalletResult {
    walletCreated: boolean;
    accountCreated: boolean;
    existingWallet?: WalletAddress;
  }

  /**
   * Helper to create wallet and account records with comprehensive error handling.
   *
   * Handles race conditions gracefully:
   * - If wallet already exists due to race condition, fetches and returns the existing record
   * - Account creation failures are logged but don't fail the operation
   *
   * IMPORTANT: This function checks for existing accounts by wallet address prefix,
   * not just exact accountId match. This prevents duplicate accounts when the same
   * wallet authenticates on different chains.
   *
   * @returns Result indicating what was created and any existing records
   */
  async function createWalletAndAccount<T extends { context: AuthContext }>(
    ctx: T,
    userId: string,
    walletAddress: string,
    chainId: number,
    isPrimary: boolean,
  ): Promise<CreateWalletResult> {
    let walletCreated = false;
    let accountCreated = false;
    let existingWallet: WalletAddress | undefined;

    // Create wallet record
    try {
      await ctx.context.adapter.create({
        model: "walletAddress",
        data: {
          userId,
          address: walletAddress,
          chainId,
          isPrimary,
          createdAt: new Date(),
        },
      });
      walletCreated = true;
    } catch (error) {
      // Check for unique constraint violations (race condition or already exists)
      const isUniqueViolation =
        error instanceof Error &&
        (error.message.toLowerCase().includes("unique") ||
          error.message.toLowerCase().includes("duplicate") ||
          error.message.includes("UNIQUE constraint") ||
          error.message.includes("duplicate key"));

      if (isUniqueViolation) {
        // Fetch the existing wallet to confirm state
        existingWallet = (await ctx.context.adapter.findOne({
          model: "walletAddress",
          where: [
            { field: "address", operator: "eq", value: walletAddress },
            { field: "chainId", operator: "eq", value: chainId },
          ],
        })) as WalletAddress | undefined;
      } else {
        throw error;
      }
    }

    // Create account record - required for Better Auth's account management
    const accountId = `${walletAddress}:${chainId}`;

    // Check if account already exists for this WALLET ADDRESS (any chain)
    // This prevents duplicate accounts when same wallet authenticates on different chains
    // We look for any account where accountId starts with the wallet address
    const existingAccounts = (await ctx.context.adapter.findMany({
      model: "account",
      where: [
        { field: "providerId", operator: "eq", value: "siwe-wallet-agnostic" },
        { field: "userId", operator: "eq", value: userId },
      ],
    })) as { accountId: string }[] | null;

    // Check exact match for this specific chain
    const hasExactAccount = existingAccounts?.some(
      (acc) => acc.accountId === accountId,
    );

    if (!hasExactAccount) {
      // Only create if no exact match exists
      // Note: We allow multiple accounts for same wallet on different chains
      // but the first one is the "canonical" one for this user
      try {
        await ctx.context.internalAdapter.createAccount({
          userId,
          providerId: "siwe-wallet-agnostic",
          accountId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        accountCreated = true;
      } catch (error) {
        // Only ignore unique violations (race condition with another request)
        const isUniqueViolation =
          error instanceof Error &&
          (error.message.toLowerCase().includes("unique") ||
            error.message.toLowerCase().includes("duplicate"));

        if (!isUniqueViolation) {
          // Non-duplicate errors are critical - rethrow
          throw error;
        }
        // Race condition: another request created it first - that's OK
      }
    }

    return { walletCreated, accountCreated, existingWallet };
  }

  return {
    id: "siwe-wallet-agnostic",
    schema: mergeSchema(schema, customSchema),

    endpoints: {
      /**
       * GET /siwe-wallet-agnostic/nonce
       * Generate a new nonce for SIWE authentication
       * No wallet address required - supports ERC-6492
       */
      getNonce: createAuthEndpoint(
        "/siwe-wallet-agnostic/nonce",
        {
          method: "GET",
        },
        async (ctx) => {
          try {
            const nonceValue = generateNonce();
            const now = new Date();
            const expiresAt = new Date(
              now.getTime() + nonceExpiresInSeconds * 1000,
            );

            // Store nonce in database
            // Note: Better Auth handles ID generation
            await ctx.context.adapter.create({
              model: "nonce",
              data: {
                value: nonceValue,
                expiresAt,
                createdAt: now,
              },
            });

            // Probabilistic cleanup of expired nonces (fire and forget)
            // Runs ~25% of the time to balance performance vs accumulation
            // NOTE: For high-traffic production apps, implement a scheduled job:
            //   DELETE FROM nonce WHERE expires_at < NOW();
            if (Math.random() < NONCE_CLEANUP_PROBABILITY) {
              ctx.context.adapter
                .deleteMany?.({
                  model: "nonce",
                  where: [
                    { field: "expiresAt", operator: "lt", value: new Date() },
                  ],
                })
                .catch((err: unknown) => {
                  // Log cleanup failures for monitoring (non-critical but useful for ops)
                  console.warn(
                    "[siwe-wallet-agnostic] Nonce cleanup failed:",
                    err,
                  );
                });
            }

            return ctx.json({ nonce: nonceValue });
          } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to generate nonce",
            });
          }
        },
      ),

      /**
       * POST /siwe-wallet-agnostic/verify
       * Verify SIWE signature and authenticate user
       *
       * Security validations performed (IN THIS ORDER - order matters!):
       * 1. Parse and validate SIWE message format
       * 2. Validate domain matches configured domain (prevents cross-domain replay)
       * 3. Validate URI matches configured URI
       * 4. Validate expiration time and notBefore
       * 5. Validate chain ID is allowed
       * 6. Validate nonce FORMAT (defense in depth, no DB query yet)
       * 7. VERIFY SIGNATURE FIRST - proves request is from wallet owner
       * 8. THEN atomically consume nonce - prevents replay attacks
       * 9. Create/update user and session
       *
       * SECURITY ARCHITECTURE - Why verify signature BEFORE consuming nonce:
       *
       * The previous approach (consume-then-verify) had a critical flaw:
       * - Nonces are wallet-agnostic (required for ERC-6492 smart wallet support)
       * - An attacker could obtain a valid nonce, craft a message with ANY address,
       *   submit with an invalid signature, and the nonce would be consumed
       * - This enabled "nonce exhaustion attacks" - DoS against legitimate users
       *
       * The correct approach (verify-then-consume):
       * - Signature verification PROVES the request comes from the wallet owner
       * - Only after cryptographic proof do we consume the nonce
       * - Attackers without the private key CANNOT pass signature verification
       * - Attackers CANNOT exhaust nonces because their requests fail at step 7
       *
       * Why this is NOT vulnerable to timing attacks:
       * - The nonce is embedded IN the signed message (visible to everyone)
       * - Signature verification is deterministic - no secret timing variations
       * - An attacker who knows a valid nonce still can't forge a signature
       * - The only "leak" is whether a nonce exists, but nonces are random
       *   and high-entropy (32 alphanumeric chars = ~190 bits)
       */
      verify: createAuthEndpoint(
        "/siwe-wallet-agnostic/verify",
        {
          method: "POST",
          body: verifyBodySchema,
          requireRequest: true,
        },
        async (ctx) => {
          const { message, signature, email } = ctx.body;

          try {
            // 1. Parse the message - supports both standard SIWE and simplified formats (Base SDK)
            const parsedMessage = parseMessage(message);

            const nonceValue = parsedMessage.nonce;
            const rawAddress = parsedMessage.address;
            const chainId = parsedMessage.chainId;

            // 2. SECURITY: Validate message security fields
            // This is CRITICAL - prevents cross-domain replay attacks
            validateMessageSecurity(parsedMessage);

            // 3. Validate chain ID is allowed
            validateChainId(chainId);

            // 4. Validate address format
            if (!isValidWalletAddress(rawAddress)) {
              throw new APIError("BAD_REQUEST", {
                message: "Invalid wallet address in SIWE message",
              });
            }

            // Convert to EIP-55 checksummed format for storage
            // This matches the official Better Auth SIWE plugin behavior
            const walletAddress = toChecksummedAddress(rawAddress);

            // 5. Validate nonce FORMAT before any expensive operations
            // This is defense-in-depth - catches malformed nonces early
            if (!isValidNonce(nonceValue)) {
              throw new APIError("UNAUTHORIZED", {
                message: "Invalid or expired nonce",
              });
            }

            // 6. VERIFY SIGNATURE FIRST (supports ERC-6492)
            //
            // CRITICAL SECURITY: We verify BEFORE consuming the nonce.
            // This prevents "nonce exhaustion attacks" where an attacker:
            // - Gets a valid nonce
            // - Crafts a message with someone else's wallet address
            // - Submits with invalid signature
            // - Under old logic: nonce consumed, legitimate user blocked
            // - Under new logic: signature fails, nonce preserved
            //
            // Only after cryptographic proof that the requester controls
            // the claimed wallet do we proceed to consume the nonce.
            await verifySignature(message, signature, rawAddress, chainId);

            // 7. ATOMIC: Validate and consume nonce
            // Now that we've proven the request is from the wallet owner,
            // we can safely consume the nonce. This prevents replay attacks
            // where someone might try to reuse a captured valid request.
            await validateAndConsumeNonce(ctx.context.adapter, nonceValue);

            // 8. Find or create user
            // Check if this address+chainId combination exists
            const existingWallet =
              await ctx.context.adapter.findOne<WalletAddress | null>({
                model: "walletAddress",
                where: [
                  { field: "address", operator: "eq", value: walletAddress },
                  { field: "chainId", operator: "eq", value: chainId },
                ],
              });

            let user: {
              id: string;
              name: string;
              email: string;
              image: string | null;
            } | null = null;

            // Case 1: Wallet exists for this chain - get existing user
            if (existingWallet) {
              user = await ctx.context.adapter.findOne({
                model: "user",
                where: [
                  { field: "id", operator: "eq", value: existingWallet.userId },
                ],
              });
            }

            // Case 2: Check if this address exists on any other chain
            if (!user) {
              const anyWallet =
                await ctx.context.adapter.findOne<WalletAddress | null>({
                  model: "walletAddress",
                  where: [
                    { field: "address", operator: "eq", value: walletAddress },
                  ],
                });

              if (anyWallet) {
                // Same address exists on different chain - link to same user
                user = await ctx.context.adapter.findOne({
                  model: "user",
                  where: [
                    { field: "id", operator: "eq", value: anyWallet.userId },
                  ],
                });

                if (user) {
                  // Create wallet record for this chain
                  await createWalletAndAccount(
                    ctx,
                    user.id,
                    walletAddress,
                    chainId,
                    false,
                  );
                }
              }
            }

            // Case 3: Check if user exists by email (handles orphaned users)
            if (!user) {
              const userEmail =
                !anonymous && email
                  ? email
                  : `${walletAddress.toLowerCase()}@${getEmailDomain()}`;

              const existingUserByEmail = await ctx.context.adapter.findOne<{
                id: string;
                name: string;
                email: string;
                image: string | null;
              } | null>({
                model: "user",
                where: [{ field: "email", operator: "eq", value: userEmail }],
              });

              if (existingUserByEmail) {
                user = {
                  id: existingUserByEmail.id,
                  name: existingUserByEmail.name,
                  email: existingUserByEmail.email,
                  image: existingUserByEmail.image ?? null,
                };

                // Create missing wallet record
                await createWalletAndAccount(
                  ctx,
                  user.id,
                  walletAddress,
                  chainId,
                  true,
                );
              }
            }

            // Case 4: Create new user
            if (!user) {
              const userEmail =
                !anonymous && email
                  ? email
                  : `${walletAddress.toLowerCase()}@${getEmailDomain()}`;

              // ENS lookup with checksummed address for proper reverse resolution
              const ensResult = await ensLookup?.({ walletAddress });

              const newUser = await ctx.context.internalAdapter.createUser({
                name: ensResult?.name ?? walletAddress,
                email: userEmail,
                emailVerified: false,
                image: ensResult?.avatar ?? null,
              });

              user = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                image: newUser.image ?? null,
              };

              // Create wallet record
              await createWalletAndAccount(
                ctx,
                user.id,
                walletAddress,
                chainId,
                true,
              );
            }

            // At this point user is guaranteed to exist
            if (!user) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "Failed to create or find user",
              });
            }

            // 9. Create session using internal adapter
            const session = await ctx.context.internalAdapter.createSession(
              user.id,
              ctx,
            );

            if (!session) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "Failed to create session",
              });
            }

            // 10. Set session cookie using Better Auth's utility
            // Note: If this fails, the session remains in DB but is harmless:
            // - Sessions expire naturally
            // - Without the cookie, the client cannot use the session
            // - Adding cleanup logic here introduces more failure modes
            await setSessionCookie(ctx, {
              session,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: false,
                image: user.image,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            return ctx.json({
              token: session.token,
              success: true,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                walletAddress,
                chainId,
              },
            });
          } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Something went wrong. Please try again later.",
            });
          }
        },
      ),

      /**
       * POST /siwe-wallet-agnostic/link
       * Link a wallet to an existing authenticated user
       *
       * Same security architecture as verify endpoint:
       * - Verify signature FIRST (proves wallet ownership)
       * - THEN consume nonce (prevents replay attacks)
       * - This order prevents nonce exhaustion attacks
       */
      linkWallet: createAuthEndpoint(
        "/siwe-wallet-agnostic/link",
        {
          method: "POST",
          body: linkWalletBodySchema,
          use: [sessionMiddleware],
          requireRequest: true,
        },
        async (ctx) => {
          // Session is guaranteed by sessionMiddleware
          const session = ctx.context.session;

          const { message, signature } = ctx.body;

          try {
            // Parse message - supports both standard SIWE and simplified formats (Base SDK)
            const parsedMessage = parseMessage(message);

            const nonceValue = parsedMessage.nonce;
            const rawAddress = parsedMessage.address;
            const chainId = parsedMessage.chainId;

            // SECURITY: Validate message security fields
            validateMessageSecurity(parsedMessage);

            // Validate chain ID
            validateChainId(chainId);

            // Validate and checksum address
            if (!isValidWalletAddress(rawAddress)) {
              throw new APIError("BAD_REQUEST", {
                message: "Invalid wallet address",
              });
            }
            // Convert to EIP-55 checksummed format for storage
            const walletAddress = toChecksummedAddress(rawAddress);

            // Validate nonce FORMAT (defense in depth)
            if (!isValidNonce(nonceValue)) {
              throw new APIError("UNAUTHORIZED", {
                message: "Invalid or expired nonce",
              });
            }

            // VERIFY SIGNATURE FIRST - proves the user controls this wallet
            // This must happen BEFORE consuming the nonce to prevent exhaustion attacks
            await verifySignature(message, signature, rawAddress, chainId);

            // ATOMIC: Now consume the nonce (after signature is verified)
            await validateAndConsumeNonce(ctx.context.adapter, nonceValue);

            // Check if wallet already linked to ANY user
            const existingWallet =
              await ctx.context.adapter.findOne<WalletAddress | null>({
                model: "walletAddress",
                where: [
                  { field: "address", operator: "eq", value: walletAddress },
                ],
              });

            if (existingWallet) {
              // Check if it belongs to a DIFFERENT user
              if (existingWallet.userId !== session.user.id) {
                // Wallet belongs to another user - generic error to prevent info leakage
                throw new APIError("BAD_REQUEST", {
                  message: "Unable to link wallet",
                });
              }

              // Wallet belongs to current user - check if this specific chain combo exists
              const existingChainWallet = await ctx.context.adapter.findOne({
                model: "walletAddress",
                where: [
                  { field: "address", operator: "eq", value: walletAddress },
                  { field: "chainId", operator: "eq", value: chainId },
                ],
              });

              if (existingChainWallet) {
                // Already linked on this chain - return success (idempotent)
                return ctx.json({
                  success: true,
                  wallet: {
                    address: walletAddress,
                    chainId,
                  },
                });
              }
              // Same address on different chain - allow linking below
            }

            // Link wallet to current user
            const result = await createWalletAndAccount(
              ctx,
              session.user.id,
              walletAddress,
              chainId,
              false, // Not primary when linking additional wallets
            );

            // Handle race condition - if wallet was created by another request
            if (!result.walletCreated && result.existingWallet) {
              if (result.existingWallet.userId !== session.user.id) {
                throw new APIError("BAD_REQUEST", {
                  message: "Unable to link wallet",
                });
              }
              // Race condition but same user - success
            }

            return ctx.json({
              success: true,
              wallet: {
                address: walletAddress,
                chainId,
              },
            });
          } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to link wallet",
            });
          }
        },
      ),

      /**
       * POST /siwe-wallet-agnostic/unlink
       * Unlink a wallet from the authenticated user
       */
      unlinkWallet: createAuthEndpoint(
        "/siwe-wallet-agnostic/unlink",
        {
          method: "POST",
          body: unlinkBodySchema,
          use: [sessionMiddleware],
          requireRequest: true,
        },
        async (ctx) => {
          // Session is guaranteed by sessionMiddleware
          const session = ctx.context.session;

          const { address: rawAddress } = ctx.body;
          const walletAddress = toChecksummedAddress(rawAddress);

          try {
            // Find wallet owned by current user
            const wallet =
              await ctx.context.adapter.findOne<WalletAddress | null>({
                model: "walletAddress",
                where: [
                  { field: "address", operator: "eq", value: walletAddress },
                  { field: "userId", operator: "eq", value: session.user.id },
                ],
              });

            if (!wallet) {
              throw new APIError("NOT_FOUND", {
                message: "Wallet not found",
              });
            }

            if (wallet.isPrimary) {
              throw new APIError("BAD_REQUEST", {
                message: "Cannot unlink primary wallet",
              });
            }

            // Delete wallet record
            await ctx.context.adapter.delete({
              model: "walletAddress",
              where: [{ field: "id", value: wallet.id }],
            });

            return ctx.json({ success: true });
          } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to unlink wallet",
            });
          }
        },
      ),

      /**
       * GET /siwe-wallet-agnostic/wallets
       * Get all wallets linked to the authenticated user
       */
      getWallets: createAuthEndpoint(
        "/siwe-wallet-agnostic/wallets",
        {
          method: "GET",
          use: [sessionMiddleware],
          requireRequest: true,
        },
        async (ctx) => {
          // Session is guaranteed by sessionMiddleware
          const session = ctx.context.session;

          try {
            const wallets = await ctx.context.adapter.findMany<WalletAddress>({
              model: "walletAddress",
              where: [
                { field: "userId", operator: "eq", value: session.user.id },
              ],
              sortBy: { field: "createdAt", direction: "desc" },
            });

            return ctx.json({
              wallets: wallets.map((w) => ({
                id: w.id,
                address: w.address,
                chainId: w.chainId,
                isPrimary: w.isPrimary,
                createdAt: w.createdAt,
              })),
            });
          } catch {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to get wallets",
            });
          }
        },
      ),
    },
  };
};

export default siweWalletAgnostic;
