/**
 * Neynar API client for Convex.
 * We can't use the Neynar SDK in Convex because it relies on Node.js-specific APIs,
 * so we use native fetch instead.
 */

// Neynar API response types
export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address?: string;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

export interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

const NEYNAR_API_BASE = "https://api.neynar.com/v2";

function getApiKey(): string {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    throw new Error("NEYNAR_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Fetch a single user by FID from Neynar API.
 */
export async function fetchUserByFid(fid: number): Promise<NeynarUser | null> {
  const response = await fetch(
    `${NEYNAR_API_BASE}/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": getApiKey(),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Neynar API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as NeynarBulkUsersResponse;
  return data.users[0] ?? null;
}

/**
 * Fetch multiple users by FIDs from Neynar API.
 */
export async function fetchUsersByFids(fids: number[]): Promise<NeynarUser[]> {
  if (fids.length === 0) return [];

  const response = await fetch(
    `${NEYNAR_API_BASE}/farcaster/user/bulk?fids=${fids.join(",")}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": getApiKey(),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Neynar API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as NeynarBulkUsersResponse;
  return data.users;
}
