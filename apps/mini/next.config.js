import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@ethmumb.ai/ui"],

  typedRoutes: true,
  cacheComponents: true,
  typescript: { ignoreBuildErrors: true },

  // Server-side packages that should not be bundled
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  turbopack: {
    // Turbopack handles Node.js polyfills differently than webpack
    // For browser bundles, these modules are automatically excluded
    resolveAlias: {},
  },
  // Allow remote images from any https host
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },

  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
