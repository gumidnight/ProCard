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

  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  const gameConnections = await findGameConnectionsByProfileId(profile.id);
  const socialLinks = await findSocialLinksByProfileId(profile.id);
  const teamHistory = await findTeamHistoryByProfileId(profile.id);
  const rolesPlayed = await findRolesPlayedByProfileId(profile.id);

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
  const existing = await findProfileByUserId(user.id);
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
    const profile = await createProfile({
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
      const updated = await updateProfile(profile.id, { esports_role });
      return NextResponse.json({ profile: updated }, { status: 201 });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
    }
    console.error("[profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  const profile = await findProfileByUserId(user.id);
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
    "esports_role",
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

  // Validate current_team_logo_url scheme
  if (
    updates.current_team_logo_url &&
    typeof updates.current_team_logo_url === "string"
  ) {
    const t = updates.current_team_logo_url.trim();
    if (!/^https?:\/\//i.test(t)) {
      return NextResponse.json(
        { error: "current_team_logo_url must be an http(s) URL" },
        { status: 400 },
      );
    }
    updates.current_team_logo_url = t;
  }

  // Set published_at when publishing
  if (updates.is_published === 1 && !profile.published_at) {
    updates.published_at = Math.floor(Date.now() / 1000);
  }

  try {
    const updated = await updateProfile(profile.id, updates);
    return NextResponse.json({ profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
    }
    console.error("[profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
