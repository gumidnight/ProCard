import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  findGameConnectionsByProfileId,
  updateGameConnectionRank,
} from "@/lib/db/game-connections";
import { fetchLolRankByPuuid, fetchTftRankByPuuid } from "@/lib/api/riot";
import type { GameConnectionRow } from "@/types/db";

const REFRESH_COOLDOWN = 120; // seconds between manual refreshes

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

  // Rate-limit: check the most recently refreshed connection
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

  const results: { id: string; game: string; status: string; rank?: string }[] = [];

  for (const conn of connections) {
    try {
      if (conn.game === "lol" && conn.puuid) {
        const rank = await refreshLolRank(conn);
        results.push({
          id: conn.id,
          game: "lol",
          status: "ok",
          rank: rank ? `${rank.tier} ${rank.rank} ${rank.leaguePoints}LP` : "Unranked",
        });
      } else if (conn.game === "tft" && conn.puuid) {
        const rank = await refreshTftRank(conn);
        results.push({
          id: conn.id,
          game: "tft",
          status: "ok",
          rank: rank ? `${rank.tier} ${rank.rank} ${rank.leaguePoints}LP` : "Unranked",
        });
      } else if (conn.game === "valorant" && conn.puuid) {
        results.push({ id: conn.id, game: "valorant", status: "skipped" });
      } else {
        results.push({ id: conn.id, game: conn.game, status: "skipped" });
      }
    } catch (err) {
      results.push({
        id: conn.id,
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
  const region = (conn.region ?? "euw1") as Parameters<typeof fetchLolRankByPuuid>[1];
  const lolRank = await fetchLolRankByPuuid(conn.puuid, region);
  const soloQ = lolRank.soloQueue;

  updateGameConnectionRank(conn.id, {
    summoner_id: lolRank.summoner.id,
    rank_tier: soloQ?.tier ?? null,
    rank_division: soloQ?.rank ?? null,
    lp_rr: soloQ?.leaguePoints ?? null,
  });

  return soloQ
    ? { tier: soloQ.tier, rank: soloQ.rank, leaguePoints: soloQ.leaguePoints }
    : null;
}

async function refreshTftRank(
  conn: GameConnectionRow,
): Promise<{ tier: string; rank: string; leaguePoints: number } | null> {
  if (!conn.puuid) return null;
  const region = (conn.region ?? "euw1") as Parameters<typeof fetchTftRankByPuuid>[1];
  const entry = await fetchTftRankByPuuid(conn.puuid, region);

  updateGameConnectionRank(conn.id, {
    rank_tier: entry?.tier ?? null,
    rank_division: entry?.rank ?? null,
    lp_rr: entry?.leaguePoints ?? null,
  });

  return entry
    ? { tier: entry.tier, rank: entry.rank, leaguePoints: entry.leaguePoints }
    : null;
}
