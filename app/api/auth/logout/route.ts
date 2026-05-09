import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Destroys the session and clears the cookie.
 */
export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url));
}
