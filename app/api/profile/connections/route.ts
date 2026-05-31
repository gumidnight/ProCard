import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertGameConnection,
  deleteGameConnectionForProfile,
} from "@/lib/db/game-connections";

/**
 * POST /api/profile/connections
 * Add a CS2 connection via Faceit nickname.
 * Body: { game: "cs2", faceitNickname: string }
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const body = await req.json();
  const { game, faceitNickname } = body as { game?: string; faceitNickname?: string };

  if (game !== "cs2") {
    return NextResponse.json(
      { error: "Only cs2 supported via this endpoint" },
      { status: 400 },
    );
  }

  const nickname = typeof faceitNickname === "string" ? faceitNickname.trim() : "";
  if (!nickname) {
    return NextResponse.json({ error: "faceitNickname is required" }, { status: 400 });
  }

  const conn = await upsertGameConnection({
    id: crypto.randomUUID(),
    profile_id: profile.id,
    game: "cs2",
    faceit_nickname: nickname,
    queue_type: "premier",
  });

  return NextResponse.json({ connection: conn });
}

/**
 * DELETE /api/profile/connections?id=<connectionId>
 * Remove one of the caller's OWN connections. Ownership is enforced in SQL
 * (the delete is scoped by profile_id); a foreign/unknown id returns 404.
 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const removed = await deleteGameConnectionForProfile(id, profile.id);
  if (!removed) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
