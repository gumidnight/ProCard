import type { NextConfig } from "next";

// Baseline security headers (Phase 0). Applied to every response.
// CSP is intentionally permissive on img/script-inline for now so it does not
// break the running app; tighten script-src with a nonce in a later pass
// (see docs/cloudflare/SECURITY.md §3).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project directory so root
  // inference can't drift to a parent folder when lockfiles change.
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true, // Cloudflare Workers can't run sharp
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Wire Cloudflare bindings (DB/KV/R2/...) into `next dev` via getCloudflareContext().
// Only run during development — calling this during `next build` starts workerd
// and causes SQLITE_BUSY crashes on CI.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV !== "production") {
  initOpenNextCloudflareForDev();
}
