import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/auth/me
 * Returns the current authenticated user or 401.
 */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    discord_id: user.discord_id,
  });
}
