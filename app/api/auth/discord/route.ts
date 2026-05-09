import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDiscordAuthUrl } from "@/lib/auth/discord";
import { cookies } from "next/headers";

/**
 * GET /api/auth/discord
 * Initiates the Discord OAuth2 flow by redirecting to Discord.
 * Generates a CSRF state token stored in a cookie.
 */
export async function GET() {
  const state = crypto.randomUUID();

  // Store state in a short-lived cookie for CSRF validation
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });

  const authUrl = getDiscordAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
