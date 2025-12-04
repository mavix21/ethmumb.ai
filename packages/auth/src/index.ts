import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import type { Address, Hex } from "viem";
import { betterAuth } from "better-auth";
import { siwf } from "better-auth-siwf";
import { generateRandomString } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { siwe } from "better-auth/plugins";
import { createPublicClient, getAddress, http } from "viem";
import { mainnet } from "viem/chains";

import siweWalletAgnostic from "@myapp/better-auth-siwe-wallet-agnostic";

interface InitAuthOptions<
  TExtraPlugins extends BetterAuthPlugin[],
  TDatabase extends BetterAuthOptions["database"],
> {
  baseUrl: string;
  secret: string | undefined;
  optionsOnly?: boolean;
  database: TDatabase;
  extraPlugins?: TExtraPlugins;
  trustedOrigins?: string[];
  ensLookup?: boolean;
}

const chains: Record<number, string> = {
  // Base mainnet
  8453: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
  // Base Sepolia (testnet)
  84532: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
};

const getPublicClient = (rpcUrl: string | undefined) =>
  createPublicClient({
    transport: http(rpcUrl),
  });

function getHostname(url?: string): string {
  if (!url) return "localhost";
  try {
    return new URL(url).hostname;
  } catch {
    return "localhost";
  }
}

async function lookupEns(address: Address) {
  try {
    const client = createPublicClient({ chain: mainnet, transport: http() });
    const name = await client.getEnsName({ address });
    const avatar = name ? await client.getEnsAvatar({ name }) : null;
    return { name: name ?? address, avatar: avatar ?? "" };
  } catch {
    return { name: address, avatar: "" };
  }
}

const hostname = getHostname(process.env.SITE_URL);

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[],
  TDatabase extends BetterAuthOptions["database"],
>(options: InitAuthOptions<TExtraPlugins, TDatabase>) {
  const config = {
    baseURL: options.baseUrl,
    database: options.database,
    secret: options.secret,
    socialProviders: {
      github: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        clientId: process.env.AUTH_GITHUB_ID!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      },
    },
    plugins: [
      siwf({ hostname, allowUserToLink: false }),
      siwe({
        domain: hostname,
        getNonce: async () => {
          return Promise.resolve(generateRandomString(32, "a-z", "A-Z", "0-9"));
        },
        verifyMessage: async ({ message, signature, address, chainId }) => {
          try {
            const rpcUrl = chains[chainId];
            // Compatible with Smart Contract Accounts & EOA's via ERC-6492
            return await getPublicClient(rpcUrl).verifyMessage({
              address: getAddress(address),
              message,
              signature: signature as Hex,
            });
          } catch (e) {
            console.error("Error verifying SIWE message:", e);
            return false;
          }
        },
        ensLookup: options.ensLookup
          ? ({ walletAddress }) => lookupEns(walletAddress as Address)
          : undefined,
      }),
      siweWalletAgnostic({
        domain: hostname,
        uri: options.baseUrl,
        chains,
      }),
      nextCookies(),
      ...(options.extraPlugins ?? []),
    ],
    trustedOrigins: [
      "expo://",
      ...(process.env.SITE_URL ? [process.env.SITE_URL] : []),
      ...(options.trustedOrigins ?? []),
    ],
    logger: { disabled: options.optionsOnly },
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR:", { error, ctx });
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
