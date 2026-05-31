import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { upsertTeamHistory, findTeamHistoryByProfileId } from "@/lib/db/team-roles";
import { fetchLeaguepediaHistory } from "@/lib/api/leaguepedia";

/**
 * POST /api/connect/leaguepedia
 * Body: { playerId: string }
 *
 * Imports the authenticated user's competitive history from Leaguepedia
 * and bulk-inserts new entries into team_history (skipping duplicates by
 * team+tournament+game). Returns the full updated list.
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
  const playerId = String(body.playerId ?? "").trim();

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }
  // Leaguepedia handles are simple wiki titles: letters, digits, spaces,
  // a few punctuation chars. Reject anything that looks like an injection.
  if (!/^[\w\s\-.()']{1,80}$/u.test(playerId)) {
    return NextResponse.json({ error: "Invalid Leaguepedia player ID" }, { status: 400 });
  }

  let history;
  try {
    history = await fetchLeaguepediaHistory(playerId);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to reach Leaguepedia",
      },
      { status: 502 },
    );
  }

  if (history.length === 0) {
    return NextResponse.json(
      {
        error: `No Leaguepedia history found for "${playerId}". Check the spelling — it must match the wiki page title exactly.`,
      },
      { status: 404 },
    );
  }

  const existing = await findTeamHistoryByProfileId(profile.id);
  const existingKeys = new Set(
    existing.map((e) =>
      `${e.org_name}|${e.tournament_name ?? ""}|${e.game}`.toLowerCase(),
    ),
  );

  let order = existing.length;
  let importedCount = 0;
  for (const h of history) {
    const key = `${h.team}|${h.tournament}|lol`.toLowerCase();
    if (existingKeys.has(key)) continue;
    await upsertTeamHistory({
      id: crypto.randomUUID(),
      profile_id: profile.id,
      org_name: h.team,
      tournament_name: h.tournament,
      org_logo_url: h.teamLogo,
      role: h.role,
      game: "lol",
      start_date: h.startDate,
      end_date: h.endDate,
      result_note: null,
      display_order: order++,
    });
    existingKeys.add(key);
    importedCount++;
  }

  const entries = await findTeamHistoryByProfileId(profile.id);
  return NextResponse.json({
    imported: importedCount,
    skipped: history.length - importedCount,
    entries,
  });
}
