import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@myapp/eslint-config/base";
import { nextjsConfig } from "@myapp/eslint-config/nextjs";
import { reactConfig } from "@myapp/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
