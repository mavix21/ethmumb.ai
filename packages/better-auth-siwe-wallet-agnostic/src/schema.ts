import type { BetterAuthPluginDBSchema } from "better-auth/db";

/**
 * Better Auth schema definition for SIWE-lite plugin
 * Database agnostic - works with any adapter (SQLite, PostgreSQL, MySQL, etc.)
 *
 * Reuses the same walletAddress schema as the official SIWE plugin for compatibility.
 *
 * IMPORTANT NOTES FOR PRODUCTION:
 *
 * 1. Composite Unique Constraint:
 *    Add a unique constraint on (address, chainId) at the database level.
 *    This plugin handles violations gracefully, but the constraint provides
 *    an extra layer of protection against race conditions.
 *
 *    Example for PostgreSQL/Drizzle:
 *    ```sql
 *    CREATE UNIQUE INDEX wallet_address_chain_unique ON wallet_address (address, chain_id);
 *    ```
 *
 * 2. Cascade Deletion:
 *    The `onDelete: "cascade"` on userId reference may not be enforced by all
 *    Better Auth adapters. If your adapter doesn't support cascades, implement
 *    user deletion hooks to clean up wallet records manually.
 *
 * 3. Nonce Cleanup:
 *    For high-traffic applications, consider implementing a scheduled job
 *    (cron, background worker) to clean up expired nonces instead of relying
 *    on the probabilistic cleanup during requests. The cleanup can be done with:
 *    ```sql
 *    DELETE FROM nonce WHERE expires_at < NOW();
 *    ```
 */
export const schema = {
  /**
   * Nonce table for replay attack prevention
   * Uses delete-based consumption for atomic nonce handling
   *
   * Indexes:
   * - value: unique index for fast nonce lookups during verification
   * - expiresAt: index for efficient cleanup of expired nonces
   *
   * Security: Nonces are deleted upon consumption, not marked as used.
   * This enables atomic consumption via deleteMany with count check.
   */
  nonce: {
    fields: {
      value: {
        type: "string",
        required: true,
        unique: true, // Implicitly creates an index
      },
      expiresAt: {
        type: "date",
        required: true,
        // index: true, // Index for cleanup queries
      },
      createdAt: {
        type: "date",
        required: true,
      },
    },
  },
  /**
   * Wallet address table - same schema as official SIWE plugin
   * Links wallets to users
   *
   * Indexes:
   * - userId: index for lookups by user (e.g., listing user's wallets)
   * - address + chainId: unique composite index to prevent duplicate wallet+chain entries
   *
   * SECURITY: The unique constraint on (address, chainId) prevents:
   * - Duplicate wallet entries for the same chain
   * - Race conditions during wallet linking
   */
  walletAddress: {
    fields: {
      userId: {
        type: "string",
        references: {
          model: "user",
          field: "id",
          onDelete: "cascade", // Clean up wallets when user is deleted
        },
        required: true,
        // index: true, // Match official SIWE plugin
      },
      address: {
        type: "string",
        required: true,
        // Note: Individual index is still useful for queries by address only
      },
      chainId: {
        type: "number",
        required: true,
      },
      isPrimary: {
        type: "boolean",
        defaultValue: false,
      },
      createdAt: {
        type: "date",
        required: true,
      },
    },
    // NOTE: Composite unique constraint on (address, chainId) should be added
    // at the database level (e.g., via Drizzle schema or migration).
    // The code handles race conditions with try-catch on unique violations.
  },
} satisfies BetterAuthPluginDBSchema;
