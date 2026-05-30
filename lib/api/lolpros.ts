// ============================================================
// lolpros.gg client — unofficial public JSON API
// ------------------------------------------------------------
// lolpros.gg is a community database that links pro players to
// all of their League of Legends accounts (mains + smurfs). The
// site frontend is backed by an undocumented but public,
// unauthenticated JSON endpoint:
//
//   GET https://api.lolpros.gg/es/profiles/{slug}
//
// where {slug} is the path segment from a player URL such as
// https://lolpros.gg/player/vladi → slug "vladi".
//
// Notes / caveats:
//   - Undocumented & unofficial: no API key, no SLA. The shape
//     can change without notice; we parse defensively.
//   - lolpros is LoL-only. There is no Valorant/TFT/CS2 data here.
//   - lolpros is an *attribution* source, not proof of ownership.
//     Imported accounts are no more "verified" than a manually
//     entered Riot ID — treat accordingly.
// ============================================================

import { RIOT_REGIONS, type RiotRegion } from "./riot-regions";

const LOLPROS_API = "https://api.lolpros.gg/es/profiles";
const USER_AGENT = "ProCard/1.0 (+https://procard.gg)";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One LoL account linked to a player on lolpros, normalised to our schema. */
export interface LolprosAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
  /** Display name as stored on lolpros (usually "Name#TAG"). */
  summonerName: string;
  region: RiotRegion;
  /** Uppercase Riot tier (e.g. "DIAMOND", "CHALLENGER"), or null if unranked. */
  rankTier: string | null;
  /** Roman-numeral division ("I"–"IV"), or null for apex/unranked. */
  rankDivision: string | null;
  /** League points / LP, or null if unranked. */
  lp: number | null;
}

/** A player profile from lolpros, reduced to the fields we import. */
export interface LolprosProfile {
  name: string;
  slug: string;
  country: string | null;
  /** Primary in-game position (e.g. "mid"), if lolpros provides one. */
  position: string | null;
  accounts: LolprosAccount[];
}

// ---------------------------------------------------------------------------
// Raw API response shapes (loosely typed — we only read what we need)
// ---------------------------------------------------------------------------

interface RawRank {
  tier?: string | null;
  division?: number | null;
  league_points?: number | null;
}

interface RawAccount {
  encrypted_puuid?: string | null;
  server?: string | null;
  summoner_name?: string | null;
  gamename?: string | null;
  tagline?: string | null;
  rank?: RawRank | null;
}

interface RawProfile {
  name?: string | null;
  slug?: string | null;
  country?: string | null;
  league_player?: {
    position?: string | null;
    accounts?: RawAccount[] | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------

const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/**
 * lolpros tiers are sortable, prefixed strings like "00_challenger",
 * "30_diamond", "90_unranked". Strip the numeric prefix and uppercase the
 * remainder to match our schema's tier convention ("CHALLENGER", "DIAMOND").
 * Unranked → null (our schema uses null tier for unranked).
 */
export function normalizeLolprosTier(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tier = raw.replace(/^\d+_/, "").trim().toUpperCase();
  if (!tier || tier === "UNRANKED") return null;
  return tier;
}

/**
 * lolpros encodes division as a number (1–4, where 1 is the highest). Riot's
 * API — which the rest of our app mirrors — uses roman numerals. Apex tiers
 * have no meaningful division.
 */
export function lolprosDivisionToRoman(
  division: number | null | undefined,
  tier: string | null,
): string | null {
  if (tier && APEX_TIERS.has(tier)) return null;
  switch (division) {
    case 1:
      return "I";
    case 2:
      return "II";
    case 3:
      return "III";
    case 4:
      return "IV";
    default:
      return null;
  }
}

// lolpros server labels we've seen that don't already match a RIOT_REGIONS label.
const SERVER_ALIASES: Record<string, RiotRegion> = {
  EUN: "eun1",
  EUNE: "eun1",
  EUW: "euw1",
  NA: "na1",
  KR: "kr",
  BR: "br1",
  JP: "jp1",
  LAN: "la1",
  LAS: "la2",
  OCE: "oc1",
  TR: "tr1",
  RU: "ru",
};

/**
 * Map a lolpros server label ("EUW", "KR", …) to our internal RiotRegion
 * platform value ("euw1", "kr", …). Falls back to matching RIOT_REGIONS by
 * label, then to "euw1" if nothing matches.
 */
export function lolprosServerToRegion(server: string | null | undefined): RiotRegion {
  if (!server) return "euw1";
  const key = server.trim().toUpperCase();
  if (SERVER_ALIASES[key]) return SERVER_ALIASES[key];
  const byLabel = RIOT_REGIONS.find((r) => r.label.toUpperCase() === key);
  return byLabel?.value ?? "euw1";
}

/**
 * Extract a lolpros slug from either a full player URL or a bare slug.
 * Accepts:
 *   "https://lolpros.gg/player/vladi"        → "vladi"
 *   "lolpros.gg/player/vladi/champions"      → "vladi"
 *   "vladi"                                   → "vladi"
 * Returns null if the input isn't a usable slug.
 */
export function parseLolprosSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let slug = trimmed;
  // Pull the /player/<slug> segment out of a URL if present.
  const urlMatch = trimmed.match(/lolpros\.gg\/player\/([^/?#]+)/i);
  if (urlMatch) {
    slug = urlMatch[1];
  } else if (/[/?#]/.test(trimmed) || /^https?:/i.test(trimmed)) {
    // Looks like a URL but not a lolpros player URL — reject.
    return null;
  }

  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* keep raw slug if it isn't valid percent-encoding */
  }

  // Slugs are URL-safe tokens; reject anything with slashes/spaces/injection.
  if (!/^[\w.-]{1,80}$/u.test(slug)) return null;
  return slug;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a player's profile (and all linked LoL accounts) from lolpros.
 *
 * @param slug  The lolpros player slug (see {@link parseLolprosSlug}).
 * @returns The normalised profile, or null if the player doesn't exist (404).
 * @throws  On network errors or non-404 error responses.
 */
export async function fetchLolprosProfile(slug: string): Promise<LolprosProfile | null> {
  const url = `${LOLPROS_API}/${encodeURIComponent(slug)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      // Cache for 1h — pro account lists change rarely and this is a 3rd-party API.
      next: { revalidate: 3600 },
    });
  } catch (err) {
    throw new Error(
      `Could not reach lolpros.gg: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`lolpros.gg returned ${res.status}`);
  }

  const data = (await res.json()) as RawProfile;

  const rawAccounts = data.league_player?.accounts ?? [];
  const accounts: LolprosAccount[] = [];
  for (const acc of rawAccounts) {
    // PUUID is our dedup key and the only field we strictly require.
    if (!acc.encrypted_puuid) continue;

    const tier = normalizeLolprosTier(acc.rank?.tier);
    const gameName = (acc.gamename ?? "").trim();
    const tagLine = (acc.tagline ?? "").trim();
    const summonerName =
      (acc.summoner_name ?? "").trim() ||
      (gameName && tagLine ? `${gameName}#${tagLine}` : gameName) ||
      "Unknown";

    accounts.push({
      puuid: acc.encrypted_puuid,
      gameName,
      tagLine,
      summonerName,
      region: lolprosServerToRegion(acc.server),
      rankTier: tier,
      rankDivision: lolprosDivisionToRoman(acc.rank?.division, tier),
      lp: tier ? (acc.rank?.league_points ?? null) : null,
    });
  }

  return {
    name: (data.name ?? slug).trim(),
    slug: (data.slug ?? slug).trim(),
    country: data.country?.trim() || null,
    position: data.league_player?.position?.trim() || null,
    accounts,
  };
}
