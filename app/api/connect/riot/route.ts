import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertGameConnection,
  deleteGameConnectionById,
} from "@/lib/db/game-connections";
import {
  hasRsoCredentials,
  getRsoAuthUrl,
  connectByRiotId,
  fetchTftRankByPuuid,
  RIOT_REGIONS,
  type RiotRegion,
} from "@/lib/api/riot";

// ---------------------------------------------------------------------------
// GET  /api/connect/riot  — Initiate RSO OAuth redirect
// POST /api/connect/riot  — Manual connect via Riot ID (gameName#tagLine)
// DELETE /api/connect/riot?id=  — Remove a specific connection by ID
// ---------------------------------------------------------------------------

export async function GET() {
  if (!hasRsoCredentials()) {
    return NextResponse.json(
      { error: "RSO OAuth not configured. Use POST with riotId instead." },
      { status: 501 },
    );
  }

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("riot_oauth_state", state, {
    httpOnly: true,
    secure: false,
    maxAge: 300,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.redirect(getRsoAuthUrl(state));
}

/**
 * POST /api/connect/riot
 * Body: { riotId: "Name#TAG", region: "euw1", game: "lol"|"valorant"|"tft" }
 * Legacy body: { riotId, region, games: ["lol","valorant"] } — still supported for onboarding.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const riotId: string | undefined = body.riotId;

  if (!riotId || !riotId.includes("#")) {
    return NextResponse.json(
      { error: "Invalid Riot ID. Use format: Name#TAG" },
      { status: 400 },
    );
  }

  const [gameName, tagLine] = riotId.split("#");
  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "Invalid Riot ID format" }, { status: 400 });
  }

  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Create a profile first" }, { status: 400 });
  }

  const region: RiotRegion = body.region ?? "euw1";
  if (!RIOT_REGIONS.find((r) => r.value === region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }

  // Normalise: accept either `game` (single) or `games` (array, legacy onboarding)
  const games: string[] = body.game
    ? [body.game]
    : Array.isArray(body.games)
      ? body.games
      : ["lol"];

  const validGames = new Set(["lol", "valorant", "tft"]);
  for (const g of games) {
    if (!validGames.has(g)) {
      return NextResponse.json({ error: `Unsupported game: ${g}` }, { status: 400 });
    }
  }

  try {
    const result = await connectByRiotId(gameName, tagLine, region);
    const connections = [];
    let lolError: string | undefined;

    for (const game of games) {
      if (game === "lol") {
        const soloQ = result.lolRank?.soloQueue;
        if (!result.lolRank && result.lolError) {
          lolError = result.lolError;
        }
        const conn = upsertGameConnection({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          game: "lol",
          puuid: result.account.puuid,
          account_name: `${result.account.gameName}#${result.account.tagLine}`,
          summoner_id: result.lolRank?.summoner.id ?? null,
          region,
          rank_tier: soloQ?.tier ?? null,
          rank_division: soloQ?.rank ?? null,
          lp_rr: soloQ?.leaguePoints ?? null,
          queue_type: "RANKED_SOLO_5x5",
        });
        connections.push(conn);
      }

      if (game === "valorant") {
        const conn = upsertGameConnection({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          game: "valorant",
          puuid: result.account.puuid,
          account_name: `${result.account.gameName}#${result.account.tagLine}`,
          region,
          queue_type: "competitive",
        });
        connections.push(conn);
      }

      if (game === "tft") {
        const tftEntry = await fetchTftRankByPuuid(result.account.puuid, region).catch(
          () => null,
        );
        const conn = upsertGameConnection({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          game: "tft",
          puuid: result.account.puuid,
          account_name: `${result.account.gameName}#${result.account.tagLine}`,
          summoner_id: null,
          region,
          rank_tier: tftEntry?.tier ?? null,
          rank_division: tftEntry?.rank ?? null,
          lp_rr: tftEntry?.leaguePoints ?? null,
          queue_type: "RANKED_TFT",
        });
        connections.push(conn);
      }
    }

    return NextResponse.json({
      account: {
        gameName: result.account.gameName,
        tagLine: result.account.tagLine,
      },
      region,
      lolError,
      connections,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect Riot account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/connect/riot?id=<connectionId>
 * Removes a specific game connection by its ID.
 */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Ownership check via profile
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 400 });
  }

  deleteGameConnectionById(id);
  return NextResponse.json({ ok: true });
}
