import { defineConfig } from "eslint/config";

import { baseConfig } from "@myapp/eslint-config/base";
import { reactConfig } from "@myapp/eslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
