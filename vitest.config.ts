import { defineConfig } from "vitest/config";
import path from "node:path";

// Phase-0 test harness.
// Runs in a Node environment because the current data layer is synchronous
// better-sqlite3. When the D1 async migration lands (Phase 1), add
// `@cloudflare/vitest-pool-workers` so integration tests run inside workerd
// against real D1/KV/R2 bindings.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      include: ["lib/**"],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    // Mirror the tsconfig `@/*` -> `./*` path alias.
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
