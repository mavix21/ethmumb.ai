import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

import { env } from "@/env";

export function getConfig() {
  return createConfig({
    chains: [base],
    multiInjectedProviderDiscovery: false,
    connectors: [
      baseAccount({
        appName: env.NEXT_PUBLIC_APPLICATION_NAME,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
