import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertGameConnection,
  findGameConnectionsByProfileId,
  setGameConnectionVisibilityForProfile,
} from "@/lib/db/game-connections";
import { parseLolprosSlug, fetchLolprosProfile } from "@/lib/api/lolpros";

/**
 * POST /api/connect/lolpros
 * Body: { url: string }  — a lolpros player URL or bare slug
 *                          (e.g. "https://lolpros.gg/player/vladi" or "vladi")
 *
 * Imports ALL of a player's League of Legends accounts from lolpros.gg as
 * game connections, deduped by puuid (re-imports update ranks in place).
 * Newly-imported *unranked* accounts are hidden by default so a pro's card
 * isn't flooded with smurfs — ranked accounts stay visible.
 *
 * lolpros is an attribution source, not proof of ownership: these accounts are
 * no more "verified" than a manually entered Riot ID. Pair with the RSO OAuth
 * flow (/api/connect/riot) when true ownership verification is required.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const input = String(body.url ?? body.slug ?? "");
  const slug = parseLolprosSlug(input);
  if (!slug) {
    return NextResponse.json(
      {
        error: "Enter a lolpros.gg player URL (e.g. https://lolpros.gg/player/vladi)",
      },
      { status: 400 },
    );
  }

  let lolpros;
  try {
    lolpros = await fetchLolprosProfile(slug);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to reach lolpros.gg",
      },
      { status: 502 },
    );
  }

  if (!lolpros) {
    return NextResponse.json(
      { error: `No lolpros.gg player found for "${slug}". Check the URL.` },
      { status: 404 },
    );
  }
  if (lolpros.accounts.length === 0) {
    return NextResponse.json(
      { error: `lolpros has no linked LoL accounts for "${lolpros.name}".` },
      { status: 404 },
    );
  }

  // Pre-fetch existing LoL connections so we can distinguish new vs. updated
  // and only auto-hide *newly* imported smurfs (never override a prior choice).
  const existingPuuids = new Set(
    (await findGameConnectionsByProfileId(profile.id))
      .filter((c) => c.game === "lol" && c.puuid)
      .map((c) => c.puuid as string),
  );

  let imported = 0;
  let updated = 0;
  for (const acc of lolpros.accounts) {
    const isNew = !existingPuuids.has(acc.puuid);
    const conn = await upsertGameConnection({
      id: crypto.randomUUID(),
      profile_id: profile.id,
      game: "lol",
      puuid: acc.puuid,
      account_name:
        acc.gameName && acc.tagLine ? `${acc.gameName}#${acc.tagLine}` : acc.summonerName,
      region: acc.region,
      rank_tier: acc.rankTier,
      rank_division: acc.rankDivision,
      lp_rr: acc.lp,
      queue_type: "RANKED_SOLO_5x5",
    });

    if (isNew) {
      imported++;
      // Hide unranked smurfs by default to keep the public card focused.
      if (!acc.rankTier)
        await setGameConnectionVisibilityForProfile(conn.id, profile.id, false);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    player: {
      name: lolpros.name,
      slug: lolpros.slug,
      position: lolpros.position,
    },
    imported,
    updated,
    total: lolpros.accounts.length,
  });
}
