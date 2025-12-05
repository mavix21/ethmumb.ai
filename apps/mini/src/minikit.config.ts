import { env } from "./env";
import { ROOT_URL } from "./lib/constants";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    ownerAddress: "",
  },
  frame: {
    version: "1",
    name: env.NEXT_PUBLIC_APPLICATION_NAME,
    subtitle: "ETHMumbai PFP Generator",
    description:
      "Transform photos into ETHMumbai avatars. Choose from 3 styles: Classic Bus, Cyber Sea Link, or Heritage Gateway. Generate and share on Farcaster.",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#E2231A",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook/farcaster`,
    primaryCategory: "utility",
    tags: ["ethmumbai", "ai", "pfp", "india", "generator"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Your visual passport to Mumbai",
    ogTitle: env.NEXT_PUBLIC_APPLICATION_NAME,
    ogDescription: "Create your personalized ETHMumbai avatar in seconds.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
