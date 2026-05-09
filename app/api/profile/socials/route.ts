import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId } from "@/lib/db/profiles";
import {
  upsertSocialLink,
  findSocialLinksByProfileId,
  deleteSocialLink,
} from "@/lib/db/social-links";
import type { SocialPlatform } from "@/types/db";

const VALID_PLATFORMS: SocialPlatform[] = [
  "discord",
  "twitch",
  "twitter",
  "youtube",
  "opgg",
  "tracker",
];

/**
 * GET /api/profile/socials
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ links: [] });
  }
  const links = findSocialLinksByProfileId(profile.id);
  return NextResponse.json({ links });
}

/**
 * POST /api/profile/socials
 * Bulk-set social links: { links: [{ platform, handle_or_url }] }
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
  const { links } = body;

  if (!Array.isArray(links)) {
    return NextResponse.json(
      { error: "links must be an array" },
      { status: 400 },
    );
  }

  const inserted = links
    .filter(
      (l: { platform: string; handle_or_url: string }) =>
        VALID_PLATFORMS.includes(l.platform as SocialPlatform) &&
        l.handle_or_url?.trim(),
    )
    .map(
      (l: { platform: SocialPlatform; handle_or_url: string }, i: number) =>
        upsertSocialLink({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          platform: l.platform,
          handle_or_url: l.handle_or_url.trim(),
          display_order: i,
        }),
    );

  return NextResponse.json({ links: inserted }, { status: 201 });
}

/**
 * DELETE /api/profile/socials
 * Delete a social link by platform.
 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile" }, { status: 404 });
  }
  const body = await req.json();
  if (!body.platform) {
    return NextResponse.json(
      { error: "platform is required" },
      { status: 400 },
    );
  }
  deleteSocialLink(profile.id, body.platform);
  return NextResponse.json({ success: true });
}
