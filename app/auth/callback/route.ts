import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeDiscordCode,
  fetchDiscordUser,
  getDiscordAvatarUrl,
} from "@/lib/auth/discord";
import { upsertUser } from "@/lib/db/users";
import { findProfileByUserId } from "@/lib/db/profiles";
import { createSession } from "@/lib/auth/session";

/**
 * GET /auth/callback
 * Discord OAuth2 callback — exchanges code for tokens, creates/updates user,
 * sets session cookie, and redirects to onboarding or dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(new URL("/login?error=access_denied", req.url));
  }

  // Missing code
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  // CSRF state validation
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  // Clear the state cookie
  cookieStore.set("oauth_state", "", { maxAge: 0, path: "/" });

  try {
    // Exchange code for tokens
    const tokens = await exchangeDiscordCode(code);

    // Fetch Discord user profile
    const discordUser = await fetchDiscordUser(tokens.access_token);

    // Upsert user in DB
    const user = upsertUser({
      id: crypto.randomUUID(),
      discord_id: discordUser.id,
      username: discordUser.global_name ?? discordUser.username,
      discriminator: discordUser.discriminator,
      avatar_url: getDiscordAvatarUrl(discordUser),
      email: discordUser.email ?? null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    });

    // Create session
    await createSession(user.id);

    // Redirect based on whether they have a profile
    const profile = findProfileByUserId(user.id);
    const destination = profile ? "/dashboard" : "/onboarding";

    return NextResponse.redirect(new URL(destination, req.url));
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
