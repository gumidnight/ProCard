import { NextResponse } from "next/server";
import { findProfileBySlug } from "@/lib/db/profiles";
import { findSocialLinksByProfileId } from "@/lib/db/social-links";
import { recordSocialClick } from "@/lib/db/engagement";

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/profile/[slug]/social-click
 * Records one outbound click on a social link. Body: { linkId: string }.
 * The link must belong to the profile — platform is read server-side.
 */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const profile = await findProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let linkId: unknown;
  try {
    ({ linkId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof linkId !== "string") {
    return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
  }

  // Verify the link belongs to this profile (prevents cross-profile spoofing).
  const links = await findSocialLinksByProfileId(profile.id);
  const link = links.find((l) => l.id === linkId);
  if (!link) {
    return NextResponse.json({ error: "Unknown link" }, { status: 404 });
  }

  await recordSocialClick({
    profile_id: profile.id,
    social_link_id: link.id,
    platform: link.platform,
  });

  return NextResponse.json({ ok: true });
}
