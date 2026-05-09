import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { upsertGameConnection } from "@/lib/db/game-connections";
import {
  hasRsoCredentials,
  getRsoAuthUrl,
  connectByRiotId,
} from "@/lib/api/riot";

// ---------------------------------------------------------------------------
// GET  /api/connect/riot  — Initiate RSO OAuth redirect
// POST /api/connect/riot  — Manual connect via Riot ID (gameName#tagLine)
// ---------------------------------------------------------------------------

/** RSO OAuth redirect (only works when RIOT_CLIENT_ID/SECRET are set) */
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

/** Manual connect: { riotId: "Name#TAG", games: ["lol"] } */
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
    return NextResponse.json(
      { error: "Invalid Riot ID format" },
      { status: 400 },
    );
  }

  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Create a profile first" },
      { status: 400 },
    );
  }

  try {
    const result = await connectByRiotId(gameName, tagLine);

    // Determine which games to connect (default: whatever they selected)
    const games: string[] = body.games ?? ["lol"];

    const connections = [];

    // LoL connection
    if (games.includes("lol")) {
      const soloQ = result.lolRank?.soloQueue;
      const conn = upsertGameConnection({
        id: crypto.randomUUID(),
        profile_id: profile.id,
        game: "lol",
        puuid: result.account.puuid,
        account_name: `${result.account.gameName}#${result.account.tagLine}`,
        summoner_id: result.lolRank?.summoner.id ?? null,
        rank_tier: soloQ?.tier ?? null,
        rank_division: soloQ?.rank ?? null,
        lp_rr: soloQ?.leaguePoints ?? null,
        queue_type: "RANKED_SOLO_5x5",
      });
      connections.push(conn);
    }

    // Valorant connection — store PUUID for when rank fetch is available
    if (games.includes("valorant")) {
      const conn = upsertGameConnection({
        id: crypto.randomUUID(),
        profile_id: profile.id,
        game: "valorant",
        puuid: result.account.puuid,
        account_name: `${result.account.gameName}#${result.account.tagLine}`,
        queue_type: "competitive",
      });
      connections.push(conn);
    }

    return NextResponse.json({
      account: {
        gameName: result.account.gameName,
        tagLine: result.account.tagLine,
      },
      connections,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect Riot account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
