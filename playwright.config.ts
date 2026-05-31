import { defineConfig, devices } from "@playwright/test";

// Phase-0 e2e harness. Specs live in tests/e2e.
// Local runs need a dev server + a populated local DB + .dev.vars secrets;
// CI runs e2e in the deploy-staging pipeline (see docs/cloudflare/CICD-AND-TESTING.md).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Only auto-start a dev server for local runs against localhost.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
