# ProCard.gg — Security Hardening (Phase 6)

OWASP-mapped, with concrete fixes. Ordered by priority. These are **launch blockers** unless marked
otherwise. Many are quick wins.

> Already correct — **do not regress:** XSS-safe `MiniMarkdown` (no `dangerouslySetInnerHTML`/`eval`
> anywhere), validated OAuth CSRF state (both flows), timing-safe HMAC sessions, fully parameterised
> SQL, `is_verified`/`is_pro` excluded from self-edit, correct comment-delete authz, strict slug
> validation, path-traversal-guarded asset GET.

---

## 1. 🔴 Broken Access Control / IDOR — `A01` — CRITICAL

Any authenticated user can delete/alter **anyone's** game connections, connection visibility, and
team history by supplying a row `id`. The DB helpers filter by primary key only; the comments
claiming "ownership validated" are false.

**Fix — scope every by-id mutation to the caller's profile.** Two equivalent patterns:

```ts
// Pattern A: scope in SQL (preferred — atomic, can't forget the check)
export async function deleteGameConnectionForProfile(db, id: string, profileId: string) {
  const res = await db
    .prepare("DELETE FROM game_connections WHERE id = ? AND profile_id = ?")
    .bind(id, profileId)
    .run();
  return res.meta.changes > 0; // false ⇒ not found OR not owned ⇒ route returns 404/403
}

// Pattern B: fetch-then-verify (when you need the row)
const conn = await findGameConnectionById(db, id);
if (!conn || conn.profile_id !== profile.id) return json({ error: "Not found" }, 404);
```

Apply to: `deleteGameConnectionById`, `setGameConnectionVisibilityById`, `deleteTeamHistoryEntry`,
and `upsertTeamHistory`'s UPDATE path. The visibility route must **first** load
`findProfileByUserId(user.id)` — today it loads nothing. Add an integration test per route asserting
a second user gets 403/404. **(S each)**

**Harden the dynamic builder too:** move the column allow-list **inside** `updateProfile` so it's safe
regardless of caller (today only the route filters keys → latent column-name injection). **(S)**

## 2. 🔴 No rate limiting / abuse design — `A04` — HIGH

Anonymous `view`/`like`/`social-click`/`comments` gate only on a forgeable visitor cookie;
`recordSocialClick` has zero dedup. Enables metric fraud (undermines paid "who scouts you") and a
cheap **D1 write-cost DoS**.

**Fix (defense in depth):**

1. **WAF Rate Limiting rules** on `/api/profile/*/{view,like,social-click,comments}` and `/api/auth/*`
   / `/api/connect/*` — enforced at the edge before the Worker, so floods never cost D1 writes.
2. **Workers rate-limit binding** (10/60 s, per-colo) for cheap per-IP soft caps inside the handler.
3. **Sign the visitor cookie with HMAC** (mirror the session) and reject forged/non-UUID values:
   ```ts
   // lib/auth/visitor.ts — sign like the session: `${uuid}.${hmac}`; verify on read.
   ```
4. **Turnstile** on the comment composer and signup/claim.
5. Cap `social_link_clicks` per (visitor, link, window); make view/like dedup server-trusted.
   **(M)**

## 3. 🔴 No security headers — `A05` — HIGH (quick win)

No CSP/HSTS/X-Frame-Options/Referrer-Policy/nosniff anywhere. Add in `next.config.ts` `headers()`
(or middleware so it covers all responses):

```ts
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; img-src 'self' https://cdn.procard.gg https://cdn.discordapp.com data:; " +
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline'; frame-src https://challenges.cloudflare.com; " +
      "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
// return [{ source: "/:path*", headers: securityHeaders }]
```

Tune `script-src` (drop `'unsafe-inline'` with a nonce once feasible). A CSP also contains the
`<img src>` beacon issue in §5. **(S)**

## 4. 🔴 Plaintext OAuth tokens & PII — `A02` — HIGH

`users.access_token/refresh_token`, `users.email`, `game_connections.riot_access_token/refresh_token`
are plaintext. A single read leak = mass account compromise. `refreshRsoToken` is dead code and the
refresh path uses the static API key, so RSO tokens are **liability with no purpose**.

**Fix (in priority order):**

1. **Stop persisting Discord tokens** — they're only used once at callback to fetch the profile
   (`identify email`); drop them after use. Removes the largest exposure for free.
2. If RSO tokens must persist, **encrypt at rest** (AES-GCM via WebCrypto with `TOKEN_ENC_KEY` from a
   Worker secret) and decrypt only when needed; otherwise drop them and delete `refreshRsoToken`.
3. **Drop the `email` scope** unless a concrete need exists (notifications/billing); if kept, encrypt
   - document retention (GDPR).
4. Stop `SELECT *` on hot read paths (`findUserById` via `getSessionUser`) — select only needed
   columns so secrets never load into the public-render path. **(M–L)**

## 5. 🟠 Impersonation via unverified imports — `A01`/product — HIGH

Manual Riot-ID, lolpros, and Leaguepedia connect attach **anyone's** identity to the caller's profile
with no ownership proof, and the API returns them indistinguishably from RSO-verified — directly
contradicting "verified esports identity".

**Fix:** persist an `is_verified`/`source` flag per connection; only the RSO/owner-proven path may set
`verified`. Badge imported data as "unverified/imported" in the API and UI. Gate the public verified
mark behind RSO only. Validate/sanitise imported strings (length/charset) and require `org_logo_url`
to be an `https://lol.fandom.com` URL before storing/rendering. **(M)**

## 6. 🟠 Unvalidated `<img src>` & social URLs — `A03`/`A05` — MEDIUM

`current_team_logo_url` is allow-listed in PATCH with **no scheme check** and rendered as `<img src>`
(tracking-beacon / arbitrary-origin). `social_links.handle_or_url` stored without scheme validation
(only the renderer saves it from `javascript:`).

**Fix:** apply the team-history `http(s)`-only validation to `current_team_logo_url` in the PATCH
route; validate social `handle_or_url` scheme on input. The CSP `img-src` allow-list backstops this. **(S)**

## 7. 🟠 Session & cookie hardening — `A07` — MEDIUM

- **No revocation:** add a `users.session_version` (int) into the HMAC payload; bump on logout/compromise
  → old cookies fail verification. Enables "sign out everywhere". Optional sliding refresh at >50% TTL.
- **`secure` tied to `NODE_ENV`** (fail-open): set `secure: true` unconditionally for session/state
  cookies (HTTPS-only in prod), and fix the **Riot state cookie `secure:false`**.
- **Enforce `SESSION_SECRET` strength** in `lib/env.ts` (≥32 bytes; reject `ci-dummy`/placeholders at boot).
- **CSRF:** add an **Origin/Referer allow-list check** in middleware for all state-changing requests
  (cheap, stateless) on top of `sameSite=lax`; consider `sameSite=strict` for the session cookie.
- Consider **PKCE** + session-bound state for both OAuth flows. **(S–M)**

## 8. 🟡 Input validation & error hygiene — MEDIUM

- Introduce a shared **zod** validation layer: max-lengths on `display_name`/`tagline`/`status_note`/
  team-history text; whitelist `status`/`background_*`/`esports_role`/`country`/`game`.
- Never `throw err` raw from `/api/profile` POST/PATCH → generic 500 + server-side log only; single
  `{ error, code }` envelope across routes.
- Stop echoing upstream error strings to clients on connect/refresh routes. **(S–M)**

## 9. 🟡 Uploads — content-type & abuse — MEDIUM

- **Magic-byte sniff** the first ~12 bytes; derive ext + stored Content-Type from the sniffed type,
  not client `file.type`; **reject SVG**; validate actual byte length post-read.
- Serve assets from the **cookieless `cdn.procard.gg`** domain so a mis-typed file can't run in the app
  origin. Add upload rate limiting (KV/DO token bucket). Strip EXIF (Cloudflare Images/WASM). **(S–M)**

## 10. Pre-launch security checklist

- [ ] All by-id mutations profile-scoped; integration tests prove cross-tenant 403/404 (§1)
- [ ] `updateProfile` internal column allow-list (§1)
- [ ] WAF rate limits + Workers RL binding + signed visitor cookie + Turnstile (§2)
- [ ] Security headers (CSP/HSTS/XFO/Referrer/nosniff) live (§3)
- [ ] Discord tokens dropped or encrypted; RSO tokens encrypted or removed; `email` scope reviewed (§4)
- [ ] Imported connections badged unverified; verified mark gated to RSO (§5)
- [ ] `<img src>` + social URL scheme validation on input (§6)
- [ ] Session revocation (`session_version`), `secure:true`, Riot state `secure` fixed, `SESSION_SECRET` strength enforced (§7)
- [ ] zod validation + error envelope; no upstream error leakage (§8)
- [ ] Upload magic-byte sniffing + cookieless asset domain + upload RL (§9)
- [ ] gitleaks in CI + pre-commit; `pnpm audit`; CodeQL (see CICD)
- [ ] Secrets via `wrangler secret put`; none in repo; `SECRETS.md` rotation runbook
- [ ] Zero Trust on staging; production deploy approval gate
