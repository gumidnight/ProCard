// ============================================================
// Leaguepedia (Fandom) Cargo API client — authenticated
// ------------------------------------------------------------
// Reads competitive history from lol.fandom.com via the Cargo
// extension. Authenticates with a Fandom bot account to lift
// the rate limit from ~10 req/min (anon, IP-shared) to the
// "High API limits" group bucket.
//
// Required env vars (optional — falls back to anon if missing):
//   LEAGUEPEDIA_BOT_USER  (e.g. "AccountName@BotLabel")
//   LEAGUEPEDIA_BOT_PASS
//
// Data is CC BY-SA 3.0 — surface attribution on imported entries.
// ============================================================

const LEAGUEPEDIA_API = "https://lol.fandom.com/api.php";
const USER_AGENT = "ProCard/1.0 (+https://procard.gg)";

/** One row of competitive history pulled from Leaguepedia. */
export interface LeaguepediaEntry {
  team: string;
  tournament: string;
  role: string | null;
  /** "YYYY-MM" — matches our team_history.start_date convention. */
  startDate: string | null;
  endDate: string | null;
  /** Public URL to the team's logo image (resolved via Special:FilePath). */
  teamLogo: string | null;
}

interface CargoRow {
  title: {
    Team?: string;
    OverviewPage?: string;
    Role?: string;
  };
}

interface CargoResponse {
  cargoquery?: CargoRow[];
  error?: { code: string; info: string };
}

// ---------------------------------------------------------------------------
// Session cache (module-scoped; survives across requests in the same worker)
// ---------------------------------------------------------------------------

interface Session {
  /** Concatenated cookie header value, e.g. "name1=val1; name2=val2". */
  cookieHeader: string;
  /** Unix ms when we should re-login as a precaution. */
  expiresAt: number;
}

let cachedSession: Session | null = null;
let inflightLogin: Promise<Session | null> | null = null;

/** ~6h — Fandom sessions last longer but rotating is cheap insurance. */
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toYearMonth(date: string | undefined | null): string | null {
  if (!date) return null;
  const m = date.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse all Set-Cookie headers into a single "name=val; name=val" string. */
function extractCookies(res: Response): string {
  const headersWithGetSetCookie = res.headers as unknown as {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof headersWithGetSetCookie.getSetCookie === "function"
      ? headersWithGetSetCookie.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""].filter(Boolean);

  const jar: Record<string, string> = {};
  for (const raw of setCookies) {
    const first = raw.split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) {
      jar[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
    }
  }
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/** Merge cookies from a new response into an existing cookie header. */
function mergeCookies(existing: string, fresh: string): string {
  if (!fresh) return existing;
  const jar: Record<string, string> = {};
  for (const part of (existing + "; " + fresh).split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) jar[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function loginToLeaguepedia(): Promise<Session | null> {
  const user = process.env.LEAGUEPEDIA_BOT_USER;
  const pass = process.env.LEAGUEPEDIA_BOT_PASS;
  if (!user || !pass) return null; // anon fallback

  // Step 1 — fetch login token (also seeds initial session cookies).
  const tokenParams = new URLSearchParams({
    action: "query",
    meta: "tokens",
    type: "login",
    format: "json",
  });
  const tokenRes = await fetch(`${LEAGUEPEDIA_API}?${tokenParams}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!tokenRes.ok) {
    throw new Error(`Leaguepedia login (token) returned ${tokenRes.status}`);
  }
  const tokenCookies = extractCookies(tokenRes);
  const tokenJson = (await tokenRes.json()) as {
    query?: { tokens?: { logintoken?: string } };
  };
  const loginToken = tokenJson.query?.tokens?.logintoken;
  if (!loginToken) {
    throw new Error("Leaguepedia login: no logintoken in response");
  }

  // Step 2 — actually log in.
  const loginBody = new URLSearchParams({
    action: "login",
    lgname: user,
    lgpassword: pass,
    lgtoken: loginToken,
    format: "json",
  });
  const loginRes = await fetch(LEAGUEPEDIA_API, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: tokenCookies,
    },
    body: loginBody,
  });
  if (!loginRes.ok) {
    throw new Error(`Leaguepedia login returned ${loginRes.status}`);
  }
  const loginJson = (await loginRes.json()) as {
    login?: { result?: string; reason?: string };
  };
  if (loginJson.login?.result !== "Success") {
    throw new Error(
      `Leaguepedia login failed: ${loginJson.login?.result ?? "unknown"}${
        loginJson.login?.reason ? ` — ${loginJson.login.reason}` : ""
      }`,
    );
  }

  const finalCookies = mergeCookies(tokenCookies, extractCookies(loginRes));
  return {
    cookieHeader: finalCookies,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

/** Returns a usable session, logging in (or reusing the cache) as needed. */
async function getSession(forceRefresh = false): Promise<Session | null> {
  if (!forceRefresh && cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }
  if (inflightLogin) return inflightLogin;

  inflightLogin = (async () => {
    try {
      const fresh = await loginToLeaguepedia();
      cachedSession = fresh;
      return fresh;
    } catch (err) {
      // If login is misconfigured, fall back to anon for this request rather
      // than blocking the whole feature.
      console.error("[leaguepedia] login failed, falling back to anon:", err);
      cachedSession = null;
      return null;
    } finally {
      inflightLogin = null;
    }
  })();
  return inflightLogin;
}

// ---------------------------------------------------------------------------
// Team logos
// ---------------------------------------------------------------------------

interface TeamRow {
  title: { Name?: string; Image?: string };
}

/**
 * Fetch logo image URLs for a batch of team names.
 * Returns a Map keyed by lowercased team name → resolved image URL.
 */
async function fetchTeamLogos(
  teamNames: string[],
  session: Session | null,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = Array.from(new Set(teamNames.map((t) => t.trim()).filter(Boolean)));
  if (unique.length === 0) return result;

  // Build a SQL-IN clause: Name="A" OR Name="B" OR ...
  // Cargo's `where` supports OR; we cap at 50 names per query for URL length safety.
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) {
    chunks.push(unique.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const where = chunk.map((n) => `Name="${n.replace(/"/g, "")}"`).join(" OR ");
    const params = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      tables: "Teams",
      fields: "Name,Image",
      where,
      limit: String(chunk.length),
    });
    const url = `${LEAGUEPEDIA_API}?${params.toString()}`;
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    if (session) headers.Cookie = session.cookieHeader;

    const res = await fetch(url, { headers, next: { revalidate: 21600 } });
    if (!res.ok) continue;
    const json = (await res.json()) as {
      cargoquery?: TeamRow[];
      error?: { code: string; info: string };
    };
    if (json.error || !json.cargoquery) continue;

    for (const row of json.cargoquery) {
      const name = row.title.Name?.trim();
      const image = row.title.Image?.trim();
      if (!name || !image) continue;
      // Special:FilePath redirects to the actual CDN URL.
      // Spaces in filenames must become underscores; URL-encode the rest.
      const safeName = image.replace(/ /g, "_");
      result.set(
        name.toLowerCase(),
        `https://lol.fandom.com/wiki/Special:FilePath/${encodeURIComponent(safeName)}`,
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tournament metadata (name + dates)
// ---------------------------------------------------------------------------

interface TournamentRow {
  title: {
    OverviewPage?: string;
    Name?: string;
    DateStart?: string;
    Date?: string;
  };
}

interface TournamentMeta {
  name: string;
  startDate: string | null; // YYYY-MM
  endDate: string | null;
}

/**
 * Fetch tournament name + dates for a batch of OverviewPage values.
 * Returns a Map keyed by OverviewPage → meta.
 */
async function fetchTournamentMeta(
  overviewPages: string[],
  session: Session | null,
): Promise<Map<string, TournamentMeta>> {
  const result = new Map<string, TournamentMeta>();
  const unique = Array.from(new Set(overviewPages.map((p) => p.trim()).filter(Boolean)));
  if (unique.length === 0) return result;

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) {
    chunks.push(unique.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const where = chunk.map((n) => `OverviewPage="${n.replace(/"/g, "")}"`).join(" OR ");
    const params = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      tables: "Tournaments",
      // `Date` is the end date on Leaguepedia's schema (mirrors wiki conventions).
      fields: "OverviewPage,Name,DateStart,Date",
      where,
      limit: String(chunk.length),
    });
    const url = `${LEAGUEPEDIA_API}?${params.toString()}`;
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    if (session) headers.Cookie = session.cookieHeader;

    const res = await fetch(url, { headers, next: { revalidate: 21600 } });
    if (!res.ok) continue;
    const json = (await res.json()) as {
      cargoquery?: TournamentRow[];
      error?: { code: string; info: string };
    };
    if (json.error || !json.cargoquery) continue;

    for (const row of json.cargoquery) {
      const op = row.title.OverviewPage?.trim();
      if (!op) continue;
      result.set(op, {
        name: row.title.Name?.trim() || op,
        startDate: toYearMonth(row.title.DateStart),
        endDate: toYearMonth(row.title.Date),
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a player's tournament history from Leaguepedia.
 *
 * @param playerId  Leaguepedia player ID — the exact wiki page title
 *                  (e.g. "Faker", "Caps"). Case-sensitive.
 */
export async function fetchLeaguepediaHistory(
  playerId: string,
): Promise<LeaguepediaEntry[]> {
  // Single-table query — avoids JOIN syntax that some MW/Cargo versions reject.
  // OverviewPage is the wiki page title of the tournament (e.g. "LEC/2024 Season/Spring Season")
  // which doubles as a human-readable tournament name. We'll do a second lookup
  // for dates later if needed.
  const params = new URLSearchParams({
    action: "cargoquery",
    format: "json",
    tables: "TournamentPlayers",
    fields: "Team,OverviewPage,Role",
    where: `Player="${playerId.replace(/"/g, "")}"`,
    limit: "200",
  });
  const url = `${LEAGUEPEDIA_API}?${params.toString()}`;

  const callOnce = async (session: Session | null): Promise<CargoResponse> => {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    if (session) headers.Cookie = session.cookieHeader;

    console.log("[leaguepedia] GET", url, "auth:", !!session);

    const res = await fetch(url, {
      headers,
      next: { revalidate: 21600 },
    });
    if (!res.ok) {
      throw new Error(`Leaguepedia API returned ${res.status}`);
    }
    const json = (await res.json()) as CargoResponse;
    if (json.error) {
      console.log("[leaguepedia] error response:", json.error);
    } else {
      console.log("[leaguepedia] ok, rows:", json.cargoquery?.length ?? 0);
    }
    return json;
  };

  // Up to 3 attempts. Handles rate limits with backoff, and re-logins
  // if the session is rejected.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const session = await getSession(attempt === 2); // force refresh on last try
    try {
      const data = await callOnce(session);

      if (data.error) {
        if (data.error.code === "ratelimited" && attempt < 2) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        if (
          (data.error.code === "assertuserfailed" ||
            data.error.code === "mustbeloggedin" ||
            data.error.code === "badtoken") &&
          attempt < 2
        ) {
          cachedSession = null;
          continue;
        }
        throw new Error(`Leaguepedia: ${data.error.info}`);
      }

      if (!data.cargoquery) return [];

      const rows = data.cargoquery
        .map((row) => ({
          team: (row.title.Team ?? "").trim(),
          tournament: (row.title.OverviewPage ?? "").trim(),
          role: row.title.Role?.trim() || null,
          startDate: null as string | null,
          endDate: null as string | null,
          teamLogo: null as string | null,
        }))
        .filter((e) => e.team && e.tournament);

      // Dedupe: TournamentPlayers can have multiple rows per (player, tournament, team).
      const seen = new Set<string>();
      const unique: LeaguepediaEntry[] = [];
      for (const r of rows) {
        const key = `${r.tournament}|${r.team}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(r);
      }

      // Sort newest first (client-side — avoids cargo order_by quirks).
      unique.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));

      // Enrich with tournament metadata (name + dates) and team logos in parallel.
      // Best-effort — failures here don't block returning the base entries.
      try {
        const [tournaments, logos] = await Promise.all([
          fetchTournamentMeta(
            unique.map((e) => e.tournament),
            session,
          ),
          fetchTeamLogos(
            unique.map((e) => e.team),
            session,
          ),
        ]);
        for (const e of unique) {
          const meta = tournaments.get(e.tournament);
          if (meta) {
            e.tournament = meta.name;
            e.startDate = meta.startDate;
            e.endDate = meta.endDate;
          }
          e.teamLogo = logos.get(e.team.toLowerCase()) ?? null;
        }
        // Re-sort now that we have real dates.
        unique.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
      } catch (err) {
        console.error("[leaguepedia] enrichment failed:", err);
      }

      return unique;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await sleep(800);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Leaguepedia: unknown error");
}
