import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertRolePlayed,
  findRolesPlayedByProfileId,
  deleteRolesPlayedByProfile,
} from "@/lib/db/team-roles";

/**
 * GET /api/profile/roles
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ roles: [] });
  }
  const roles = findRolesPlayedByProfileId(profile.id);
  return NextResponse.json({ roles });
}

/**
 * POST /api/profile/roles
 * Bulk-set roles: accepts { roles: [{ game, role, is_main }] }
 * Deletes all existing roles and re-inserts.
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
  const { roles } = body;

  if (!Array.isArray(roles)) {
    return NextResponse.json(
      { error: "roles must be an array" },
      { status: 400 },
    );
  }

  // Clear and re-insert
  deleteRolesPlayedByProfile(profile.id);

  const inserted = roles.map(
    (r: { game: string; role: string; is_main?: boolean }, i: number) =>
      upsertRolePlayed({
        id: crypto.randomUUID(),
        profile_id: profile.id,
        game: r.game,
        role: r.role,
        is_main: r.is_main ? 1 : 0,
        display_order: i,
      }),
  );

  return NextResponse.json({ roles: inserted }, { status: 201 });
}
