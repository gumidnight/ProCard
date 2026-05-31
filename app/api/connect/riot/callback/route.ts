import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { upsertGameConnection } from "@/lib/db/game-connections";
import {
  exchangeRsoCode,
  fetchRiotAccountByToken,
  fetchLolRankByPuuid,
} from "@/lib/api/riot";

// ---------------------------------------------------------------------------
// GET /api/connect/riot/callback — RSO OAuth callback
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/onboarding?error=riot_${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/onboarding?error=riot_missing_params", req.url),
    );
  }

  // Validate state
  const jar = await cookies();
  const savedState = jar.get("riot_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/onboarding?error=riot_invalid_state", req.url),
    );
  }
  jar.delete("riot_oauth_state");

  // Validate session
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.redirect(new URL("/onboarding?error=no_profile", req.url));
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeRsoCode(code);
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

    // Fetch Riot account
    const account = await fetchRiotAccountByToken(tokens.access_token);

    const region =
      (profile.region as import("@/lib/api/riot").RiotRegion | null) ?? "na1";
    const accountName = `${account.gameName}#${account.tagLine}`;

    // Fetch LoL rank (may fail if account doesn't play LoL)
    let soloQ: { tier: string; rank: string; leaguePoints: number } | undefined;
    let summonerId: string | undefined;
    try {
      const lolRank = await fetchLolRankByPuuid(account.puuid, region);
      summonerId = lolRank.summoner.id;
      soloQ = lolRank.soloQueue;
    } catch {
      // Not a LoL player — that's fine
    }

    // Save LoL connection
    await upsertGameConnection({
      id: crypto.randomUUID(),
      profile_id: profile.id,
      game: "lol",
      puuid: account.puuid,
      account_name: accountName,
      summoner_id: summonerId ?? null,
      riot_access_token: tokens.access_token,
      riot_refresh_token: tokens.refresh_token,
      riot_token_expires_at: expiresAt,
      rank_tier: soloQ?.tier ?? null,
      rank_division: soloQ?.rank ?? null,
      lp_rr: soloQ?.leaguePoints ?? null,
      queue_type: "RANKED_SOLO_5x5",
      region,
    });

    // Save Valorant connection (shares PUUID)
    await upsertGameConnection({
      id: crypto.randomUUID(),
      profile_id: profile.id,
      game: "valorant",
      puuid: account.puuid,
      account_name: accountName,
      riot_access_token: tokens.access_token,
      riot_refresh_token: tokens.refresh_token,
      riot_token_expires_at: expiresAt,
      queue_type: "competitive",
      region,
    });

    return NextResponse.redirect(
      new URL(`/onboarding?riot_connected=${encodeURIComponent(accountName)}`, req.url),
    );
  } catch (err) {
    console.error("Riot OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/onboarding?error=riot_exchange_failed", req.url),
    );
  }
}
