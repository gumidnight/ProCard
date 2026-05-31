// lib/db/client.ts
// In production (Cloudflare Workers), getDb() returns a D1 adapter obtained
// via getCloudflareContext(). This file re-exports from adapter.ts and keeps
// the ensureMigrated no-op so existing call sites don't break.
export { getDb } from "./adapter";

// ensureMigrated is now a no-op.
// Dev migrations are applied via `pnpm db:migrate:local`.
// Runtime auto-migration (fs.readdirSync) is removed — it was Workers-incompatible.
export function ensureMigrated(): void {}
