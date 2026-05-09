import type { DiscordTokenResponse, DiscordUser } from "@/types/api";
import { config } from "@/lib/env";

// ---------------------------------------------------------------------------
// Discord OAuth2 helpers
// ---------------------------------------------------------------------------

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_OAUTH_BASE = "https://discord.com/api/oauth2";

/**
 * Build the Discord OAuth2 authorization URL.
 * Includes CSRF state parameter.
 */
export function getDiscordAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  });
  return `${DISCORD_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeDiscordCode(
  code: string,
): Promise<DiscordTokenResponse> {
  const res = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.discord.redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<DiscordTokenResponse>;
}

/**
 * Fetch the authenticated user's Discord profile.
 */
export async function fetchDiscordUser(
  accessToken: string,
): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord user fetch failed: ${res.status}`);
  }

  return res.json() as Promise<DiscordUser>;
}

/**
 * Build the Discord avatar CDN URL (or return default avatar).
 */
export function getDiscordAvatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  // Default avatar based on discriminator or user ID
  const index =
    user.discriminator === "0"
      ? Number(BigInt(user.id) >> BigInt(22)) % 6
      : Number(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
