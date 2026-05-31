import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Required entry point for `opennextjs-cloudflare` (pnpm build:worker / preview / deploy).
// Previously MISSING — its absence was a P0 deploy blocker (see docs/cloudflare/AUDIT.md §3.1).
//
// Kept minimal for Phase 0. In Phase 1, once the KV binding is provisioned, wire the
// incremental cache so ISR/fetch output survives across isolates, e.g.:
//
//   import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
//   export default defineCloudflareConfig({ incrementalCache: kvIncrementalCache });
export default defineCloudflareConfig({});
