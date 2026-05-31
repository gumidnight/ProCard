import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / tooling output:
    ".open-next/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    // Git worktrees created by workflow agents — never lint these
    ".claude/**",
  ]),
]);

export default eslintConfig;
