import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import { setGameConnectionVisibilityForProfile } from "@/lib/db/game-connections";

/**
 * PATCH /api/profile/connections/visibility
 * Body: { id: string, visible: boolean }
 * Only affects a connection the caller owns (ownership enforced in SQL).
 */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }

  const body = (await req.json()) as { id?: string; visible?: boolean };
  const { id, visible } = body;

  if (!id || typeof visible !== "boolean") {
    return NextResponse.json(
      { error: "id (string) and visible (boolean) are required" },
      { status: 400 },
    );
  }

  const updated = await setGameConnectionVisibilityForProfile(id, profile.id, visible);
  if (!updated) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
