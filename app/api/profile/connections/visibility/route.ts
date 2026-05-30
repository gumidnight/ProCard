import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { setGameConnectionVisibilityById } from "@/lib/db/game-connections";

/**
 * PATCH /api/profile/connections/visibility
 * Body: { id: string, visible: boolean }
 */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as { id?: string; visible?: boolean };
  const { id, visible } = body;

  if (!id || typeof visible !== "boolean") {
    return NextResponse.json(
      { error: "id (string) and visible (boolean) are required" },
      { status: 400 },
    );
  }

  setGameConnectionVisibilityById(id, visible);
  return NextResponse.json({ ok: true });
}
