import { defineConfig } from "eslint/config";

import { baseConfig } from "@myapp/eslint-config/base";

export default defineConfig(
  {
    ignores: ["artifacts/**", "cache/**"],
  },
  baseConfig,
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
);
