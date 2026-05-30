import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertTeamHistory,
  findTeamHistoryByProfileId,
  deleteTeamHistoryEntry,
} from "@/lib/db/team-roles";

/**
 * GET /api/profile/team-history
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ entries: [] });
  }
  const entries = findTeamHistoryByProfileId(profile.id);
  return NextResponse.json({ entries });
}

/**
 * POST /api/profile/team-history
 * Add or update a team history entry.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const body = await req.json();
  const {
    id,
    org_name,
    tournament_name,
    org_logo_url,
    role,
    game,
    start_date,
    end_date,
    result_note,
    display_order,
  } = body;

  if (!org_name || !game) {
    return NextResponse.json(
      { error: "org_name and game are required" },
      { status: 400 },
    );
  }

  // Basic URL guard for the logo (allow http/https only)
  let logo: string | null = null;
  if (typeof org_logo_url === "string" && org_logo_url.trim()) {
    const trimmed = org_logo_url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return NextResponse.json(
        { error: "org_logo_url must be an http(s) URL" },
        { status: 400 },
      );
    }
    logo = trimmed;
  }

  const entry = upsertTeamHistory({
    id: id ?? crypto.randomUUID(),
    profile_id: profile.id,
    org_name,
    tournament_name:
      typeof tournament_name === "string" && tournament_name.trim()
        ? tournament_name.trim()
        : null,
    org_logo_url: logo,
    role: role ?? null,
    game,
    start_date: start_date ?? null,
    end_date: end_date ?? null,
    result_note: result_note ?? null,
    display_order: display_order ?? 0,
  });

  return NextResponse.json({ entry }, { status: 201 });
}

/**
 * DELETE /api/profile/team-history
 * Delete a team history entry by id (passed in body).
 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  deleteTeamHistoryEntry(body.id);
  return NextResponse.json({ success: true });
}
