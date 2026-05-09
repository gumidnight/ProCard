import { NextRequest, NextResponse } from "next/server";
import { isSlugAvailable } from "@/lib/db/profiles";
import { isValidSlug } from "@/lib/utils/slug";

/**
 * GET /api/profile/slug?slug=xxx
 * Check if a slug is valid and available.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Slug parameter required" },
      { status: 400 },
    );
  }

  const validation = isValidSlug(slug);
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      error: validation.error,
    });
  }

  const available = isSlugAvailable(slug);
  return NextResponse.json({ available });
}
