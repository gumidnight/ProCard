# Critical IDOR Report & Remediation

_Broken Object-Level Authorization (OWASP A01:2021). Generated 2026-05-30; **fixed in Phase 0**._

## Summary

Four authenticated mutation paths accepted a client-supplied row `id` and acted on it with **no
ownership check** — the underlying SQL filtered by primary key only. Any logged-in user could
delete or alter **any other user's** data. Connection IDs are returned to clients (in
`/api/profile` responses and the public profile payload), so they are not secret. Code comments
claiming "Ownership validated via profile" / "Ownership check via profile" were **false** — the
profile was loaded but never compared.

## Findings (before → after)

| #   | Endpoint                                            | Vulnerable call                                                                                                       | Root cause                                                            | Fix                                                                                                                                    |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `DELETE /api/profile/connections?id=`               | [route.ts:62](../../app/api/profile/connections/route.ts) → `deleteGameConnectionById(id)`                            | `DELETE … WHERE id = ?`                                               | `deleteGameConnectionForProfile(id, profile.id)` → `… WHERE id = ? AND profile_id = ?`; 404 on no match                                |
| 2   | `DELETE /api/connect/riot?id=`                      | [route.ts:193](../../app/api/connect/riot/route.ts) → `deleteGameConnectionById(id)`                                  | same helper, no scope                                                 | same scoped helper; 404 on no match                                                                                                    |
| 3   | `PATCH /api/profile/connections/visibility`         | [route.ts:25](../../app/api/profile/connections/visibility/route.ts) → `setGameConnectionVisibilityById(id, visible)` | route **never loaded the caller's profile**; `UPDATE … WHERE id = ?`  | now loads `findProfileByUserId`; `setGameConnectionVisibilityForProfile(id, profile.id, visible)`; 404 on no match                     |
| 4a  | `DELETE /api/profile/team-history`                  | [route.ts:107](../../app/api/profile/team-history/route.ts) → `deleteTeamHistoryEntry(body.id)`                       | no profile load; `DELETE … WHERE id = ?`                              | `deleteTeamHistoryEntryForProfile(id, profile.id)`; 404 on no match                                                                    |
| 4b  | `POST /api/profile/team-history` (object injection) | [route.ts:74](../../app/api/profile/team-history/route.ts) → `upsertTeamHistory({ id, … })`                           | `SELECT … WHERE id = ?` then UPDATE → overwrote another profile's row | upsert lookup now scoped to `(id, profile_id)`; new rows get a **server-minted id**, so a supplied foreign id can never hijack/collide |

### Exact code locations changed

**DB layer (ownership enforced in SQL):**

- [lib/db/game-connections.ts](../../lib/db/game-connections.ts) — replaced `deleteGameConnectionById` / `setGameConnectionVisibilityById` with `deleteGameConnectionForProfile(id, profileId)` and `setGameConnectionVisibilityForProfile(id, profileId, visible)`; both return `boolean` (`res.changes > 0`).
- [lib/db/team-roles.ts](../../lib/db/team-roles.ts) — `upsertTeamHistory` lookup + UPDATE scoped to `(id, profile_id)`, new rows mint a fresh `crypto.randomUUID()`; replaced `deleteTeamHistoryEntry` with `deleteTeamHistoryEntryForProfile(id, profileId)`.

**Routes (resolve caller profile, pass `profile.id`, 404 on no-match):**

- [app/api/profile/connections/route.ts](../../app/api/profile/connections/route.ts)
- [app/api/connect/riot/route.ts](../../app/api/connect/riot/route.ts)
- [app/api/profile/connections/visibility/route.ts](../../app/api/profile/connections/visibility/route.ts)
- [app/api/profile/team-history/route.ts](../../app/api/profile/team-history/route.ts)

**Legitimate owner-scoped caller updated (not a vuln):**

- [app/api/connect/lolpros/route.ts](../../app/api/connect/lolpros/route.ts) — auto-hide-smurf now passes `profile.id`.

## Verification

Integration tests in [tests/integration/idor.test.ts](../../tests/integration/idor.test.ts) assert, against a
real migrated SQLite DB, that a second profile gets a **no-op (`false`) / 404** on delete, visibility
toggle, team-history delete, and team-history upsert-overwrite, while the legitimate owner succeeds.
These run in CI (`pnpm test:integration`) and gate every PR, so the fix cannot silently regress.

## Design rule (carry into the D1 migration)

**Every by-id mutation must be scoped to the owning `profile_id` in the SQL itself** (not via a
caller-side check that can be forgotten). Return a boolean / row-count and map "no row affected" to 404. The unsafe `*ById` helpers were removed so the insecure shape is no longer reachable. Note: the
unrelated `updateProfile` column-name allow-list hardening (AUDIT §3.2) remains open for a later pass.
