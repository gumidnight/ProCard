import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createProfile, findProfileByUserId, updateProfile } from "@/lib/db/profiles";
import { findGameConnectionsByProfileId } from "@/lib/db/game-connections";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import {
  findTeamHistoryByProfileId,
  findRolesPlayedByProfileId,
} from "@/lib/db/team-roles";
import { isValidSlug } from "@/lib/utils/slug";

/**
 * GET /api/profile
 * Returns the current user's full profile data.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  const gameConnections = findGameConnectionsByProfileId(profile.id);
  const socialLinks = findSocialLinksByProfileId(profile.id);
  const teamHistory = findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = findRolesPlayedByProfileId(profile.id);

  return NextResponse.json({
    profile,
    gameConnections,
    socialLinks,
    teamHistory,
    rolesPlayed,
  });
}

/**
 * POST /api/profile
 * Creates a new profile for the current user.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if profile already exists
  const existing = findProfileByUserId(user.id);
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  const body = await req.json();
  const { slug, display_name, country, tagline, bio, esports_role } = body;

  // Validate slug
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const slugCheck = isValidSlug(slug);
  if (!slugCheck.valid) {
    return NextResponse.json({ error: slugCheck.error }, { status: 400 });
  }

  // Validate display name
  if (!display_name || typeof display_name !== "string") {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }

  try {
    const profile = createProfile({
      id: crypto.randomUUID(),
      user_id: user.id,
      slug,
      display_name,
      country: country ?? null,
      tagline: tagline ?? null,
      bio: bio ?? null,
    });

    // Set esports_role separately via updateProfile (createProfile only handles core fields)
    if (esports_role) {
      const updated = updateProfile(profile.id, { esports_role });
      return NextResponse.json({ profile: updated }, { status: 201 });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
    }
    throw err;
  }
}

/**
 * PATCH /api/profile
 * Updates the current user's profile.
 */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 404 });
  }

  const body = await req.json();
  const allowed = [
    "slug",
    "display_name",
    "country",
    "tagline",
    "bio",
    "status",
    "status_note",
    "current_team_name",
    "current_team_logo_url",
    "current_league",
    "current_role",
    "current_game",
    "esports_role",
    // Background customization. NOTE: is_verified / is_pro / banner_key /
    // background_key are intentionally NOT here — those are set by the upload
    // routes or admin/DB, so users can't self-verify or self-upgrade.
    "background_type",
    "background_preset",
    "is_published",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  // Validate slug if being changed
  if (updates.slug && typeof updates.slug === "string") {
    const slugCheck = isValidSlug(updates.slug);
    if (!slugCheck.valid) {
      return NextResponse.json({ error: slugCheck.error }, { status: 400 });
    }
  }

  // Set published_at when publishing
  if (updates.is_published === 1 && !profile.published_at) {
    updates.published_at = Math.floor(Date.now() / 1000);
  }

  try {
    const updated = updateProfile(profile.id, updates);
    return NextResponse.json({ profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
    }
    throw err;
  }
}
