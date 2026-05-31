import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertGameConnection,
  deleteGameConnectionForProfile,
} from "@/lib/db/game-connections";
import {
  hasRsoCredentials,
  getRsoAuthUrl,
  connectByRiotId,
  RIOT_REGIONS,
  type RiotRegion,
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
    secure: true,
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
    return NextResponse.json({ error: "Invalid Riot ID format" }, { status: 400 });
  }

  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Create a profile first" }, { status: 400 });
  }

  // Validate region
  const region: RiotRegion = body.region ?? "euw1";
  if (!RIOT_REGIONS.find((r) => r.value === region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }

  try {
    const result = await connectByRiotId(gameName, tagLine, region);

    // Determine which games to connect (default: whatever they selected)
    const games: string[] = body.games ?? ["lol"];

    const connectionPromises: Promise<unknown>[] = [];

    // LoL connection
    if (games.includes("lol")) {
      const soloQ = result.lolRank?.soloQueue;
      connectionPromises.push(
        upsertGameConnection({
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
        }),
      );
    }

    // Valorant connection — store PUUID for when rank fetch is available
    if (games.includes("valorant")) {
      connectionPromises.push(
        upsertGameConnection({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          game: "valorant",
          puuid: result.account.puuid,
          account_name: `${result.account.gameName}#${result.account.tagLine}`,
          region,
          queue_type: "competitive",
        }),
      );
    }

    const connections = await Promise.all(connectionPromises);

    return NextResponse.json({
      account: {
        gameName: result.account.gameName,
        tagLine: result.account.tagLine,
      },
      region,
      lolError: result.lolError,
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
 * Ownership is enforced in SQL (scoped to the caller's profile).
 */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const profile = await findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const removed = await deleteGameConnectionForProfile(id, profile.id);
  if (!removed)
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
