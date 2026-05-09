import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  findGameConnectionsByProfileId,
  upsertGameConnection,
} from "@/lib/db/game-connections";
import { fetchLolRankByPuuid } from "@/lib/api/riot";
import type { GameConnectionRow } from "@/types/db";

// ---------------------------------------------------------------------------
// POST /api/ranks/refresh — Manual rank refresh for all connected accounts
// ---------------------------------------------------------------------------

const REFRESH_COOLDOWN = 120; // 2 minutes between manual refreshes

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  const connections = findGameConnectionsByProfileId(profile.id);
  if (connections.length === 0) {
    return NextResponse.json({ error: "No game connections" }, { status: 400 });
  }

  // Rate limit: check most recent refresh
  const now = Math.floor(Date.now() / 1000);
  const mostRecent = connections.reduce(
    (latest, c) => Math.max(latest, c.last_refreshed_at ?? 0),
    0,
  );
  if (mostRecent && now - mostRecent < REFRESH_COOLDOWN) {
    const wait = REFRESH_COOLDOWN - (now - mostRecent);
    return NextResponse.json(
      { error: `Please wait ${wait}s before refreshing again` },
      { status: 429 },
    );
  }

  const results: { game: string; status: string; rank?: string }[] = [];

  for (const conn of connections) {
    try {
      if (conn.game === "lol" && conn.puuid) {
        const rank = await refreshLolRank(conn);
        results.push({
          game: "lol",
          status: "ok",
          rank: rank
            ? `${rank.tier} ${rank.rank} ${rank.leaguePoints}LP`
            : "Unranked",
        });
      } else if (conn.game === "valorant" && conn.puuid) {
        // Valorant ranked API requires RSO/partner — store PUUID for later
        results.push({ game: "valorant", status: "skipped" });
      } else {
        results.push({ game: conn.game, status: "skipped" });
      }
    } catch (err) {
      results.push({
        game: conn.game,
        status: "error",
        rank: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}

async function refreshLolRank(
  conn: GameConnectionRow,
): Promise<{ tier: string; rank: string; leaguePoints: number } | null> {
  if (!conn.puuid) return null;

  const lolRank = await fetchLolRankByPuuid(conn.puuid);
  const soloQ = lolRank.soloQueue;

  upsertGameConnection({
    id: conn.id,
    profile_id: conn.profile_id,
    game: "lol",
    summoner_id: lolRank.summoner.id,
    rank_tier: soloQ?.tier ?? null,
    rank_division: soloQ?.rank ?? null,
    lp_rr: soloQ?.leaguePoints ?? null,
  });

  return soloQ
    ? { tier: soloQ.tier, rank: soloQ.rank, leaguePoints: soloQ.leaguePoints }
    : null;
}
