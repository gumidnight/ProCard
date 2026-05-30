import { config } from "@/lib/env";
import type { RiotAccount, LolSummoner, LolLeagueEntry } from "@/types/api";
import { RIOT_REGIONS, getCluster, type RiotRegion } from "./riot-regions";

// Re-export so existing imports from "@/lib/api/riot" keep working
export { RIOT_REGIONS, type RiotRegion };

// ---------------------------------------------------------------------------
// Riot API regions
// Account API uses "regional routing" (americas/europe/asia/sea)
// LoL game API uses "platform routing" (na1/euw1/eun1/kr/...)
// ---------------------------------------------------------------------------

function accountBase(region: RiotRegion): string {
  return `https://${getCluster(region)}.api.riotgames.com`;
}

function lolBase(region: RiotRegion): string {
  return `https://${region}.api.riotgames.com`;
}

// RSO OAuth endpoints
const RSO_AUTH_URL = "https://auth.riotgames.com/authorize";
const RSO_TOKEN_URL = "https://auth.riotgames.com/token";

// ---------------------------------------------------------------------------
// RSO OAuth helpers (requires RIOT_CLIENT_ID + RIOT_CLIENT_SECRET)
// ---------------------------------------------------------------------------

export function hasRsoCredentials(): boolean {
  return !!(config.riot.clientId && config.riot.clientSecret);
}

export function getRsoAuthUrl(state: string): string {
  const params = new URLSearchParams({
    redirect_uri: config.riot.redirectUri,
    client_id: config.riot.clientId,
    response_type: "code",
    scope: "openid cpid",
    state,
  });
  return `${RSO_AUTH_URL}?${params}`;
}

export async function exchangeRsoCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(RSO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${config.riot.clientId}:${config.riot.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.riot.redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RSO token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function refreshRsoToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(RSO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${config.riot.clientId}:${config.riot.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RSO token refresh failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Account API — works with RSO access_token or API key
// ---------------------------------------------------------------------------

/** Fetch account using RSO access token (after OAuth) */
export async function fetchRiotAccountByToken(
  accessToken: string,
  region: RiotRegion = "na1",
): Promise<RiotAccount> {
  const res = await fetch(`${accountBase(region)}/riot/account/v1/accounts/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Riot account fetch failed: ${res.status}`);
  }

  return res.json();
}

/** Fetch account by Riot ID (gameName#tagLine) using API key */
export async function fetchRiotAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: RiotRegion,
): Promise<RiotAccount> {
  const res = await fetch(
    `${accountBase(region)}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: { "X-Riot-Token": config.riot.apiKey } },
  );

  if (res.status === 404) {
    throw new Error("Riot account not found. Check your Riot ID and region.");
  }
  if (!res.ok) {
    throw new Error(`Riot account lookup failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// LoL API — requires API key
// ---------------------------------------------------------------------------

/** Get summoner by PUUID — needed to get encrypted summonerId for league query */
export async function fetchLolSummoner(
  puuid: string,
  region: RiotRegion,
): Promise<LolSummoner> {
  const res = await fetch(
    `${lolBase(region)}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    { headers: { "X-Riot-Token": config.riot.apiKey } },
  );

  if (res.status === 404) {
    throw new Error(
      "Summoner not found for this PUUID. The account may not play LoL on this region.",
    );
  }
  if (!res.ok) {
    throw new Error(`LoL summoner fetch failed: ${res.status}`);
  }

  return res.json();
}

/** Get ranked entries by PUUID (newer endpoint, replaces summoner-id-based) */
export async function fetchLolRankedEntriesByPuuid(
  puuid: string,
  region: RiotRegion,
): Promise<LolLeagueEntry[]> {
  const res = await fetch(`${lolBase(region)}/lol/league/v4/entries/by-puuid/${puuid}`, {
    headers: { "X-Riot-Token": config.riot.apiKey },
  });

  if (!res.ok) {
    throw new Error(`LoL ranked fetch failed: ${res.status}`);
  }

  return res.json();
}

/** Get ranked entries for a summoner (legacy summoner-id endpoint) */
export async function fetchLolRankedEntries(
  summonerId: string,
  region: RiotRegion,
): Promise<LolLeagueEntry[]> {
  const res = await fetch(
    `${lolBase(region)}/lol/league/v4/entries/by-summoner/${summonerId}`,
    { headers: { "X-Riot-Token": config.riot.apiKey } },
  );

  if (!res.ok) {
    throw new Error(`LoL ranked fetch failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Combined: fetch LoL rank by PUUID
// ---------------------------------------------------------------------------

export interface LolRankResult {
  summoner: LolSummoner;
  soloQueue?: LolLeagueEntry;
  flexQueue?: LolLeagueEntry;
}

export async function fetchLolRankByPuuid(
  puuid: string,
  region: RiotRegion,
): Promise<LolRankResult> {
  const summoner = await fetchLolSummoner(puuid, region);
  // Use the PUUID-based endpoint (summoner-id endpoint is deprecated)
  const entries = await fetchLolRankedEntriesByPuuid(puuid, region);

  return {
    summoner,
    soloQueue: entries.find((e) => e.queueType === "RANKED_SOLO_5x5"),
    flexQueue: entries.find((e) => e.queueType === "RANKED_FLEX_SR"),
  };
}

// ---------------------------------------------------------------------------
// TFT API — ranked queue uses tft/league/v1 endpoints
// ---------------------------------------------------------------------------

export async function fetchTftRankByPuuid(
  puuid: string,
  region: RiotRegion,
): Promise<LolLeagueEntry | null> {
  // TFT shares the same summoner ID as LoL — reuse the LoL summoner endpoint
  let summonerId: string;
  try {
    const summoner = await fetchLolSummoner(puuid, region);
    summonerId = summoner.id;
  } catch {
    return null;
  }

  const res = await fetch(
    `${lolBase(region)}/tft/league/v1/entries/by-summoner/${summonerId}`,
    { headers: { "X-Riot-Token": config.riot.apiKey } },
  );
  if (!res.ok) return null;
  const entries: LolLeagueEntry[] = await res.json();
  return entries.find((e) => e.queueType === "RANKED_TFT") ?? null;
}

// ---------------------------------------------------------------------------
// Full connect flow: Riot ID → account + LoL rank
// ---------------------------------------------------------------------------

export interface RiotConnectResult {
  account: RiotAccount;
  lolRank: LolRankResult | null;
  lolError?: string;
  region: RiotRegion;
}

export async function connectByRiotId(
  gameName: string,
  tagLine: string,
  region: RiotRegion,
): Promise<RiotConnectResult> {
  const account = await fetchRiotAccountByRiotId(gameName, tagLine, region);

  let lolRank: LolRankResult | null = null;
  let lolError: string | undefined;
  try {
    lolRank = await fetchLolRankByPuuid(account.puuid, region);
  } catch (err) {
    lolError = err instanceof Error ? err.message : String(err);
    console.warn(
      `[riot] LoL fetch failed for ${gameName}#${tagLine} on ${region}:`,
      lolError,
    );
  }

  return { account, lolRank, lolError, region };
}
