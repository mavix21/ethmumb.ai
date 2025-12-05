import { defineConfig } from "eslint/config";

import { baseConfig } from "@ethmumb.ai/eslint-config/base";
import { reactConfig } from "@ethmumb.ai/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
