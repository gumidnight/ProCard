import { NextResponse } from "next/server";
import { findProfileBySlug } from "@/lib/db/profiles";
import {
  recordProfileView,
  recordViewEvent,
  countProfileViews,
} from "@/lib/db/engagement";
import { getOrCreateVisitorId, visitorCookieOptions } from "@/lib/auth/visitor";
import { getSessionUser } from "@/lib/auth/session";

interface Params {
  params: Promise<{ slug: string }>;
}

/** Reduce a full referrer URL to its bare host (e.g. "twitter.com"). */
function referrerHost(raw: unknown): string | null {
  if (typeof raw !== "string" || raw === "") return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/profile/[slug]/view
 * Records a unique visit (deduped per visitor cookie) and a richer view
 * event (referrer + country + signed-in viewer) for analytics.
 * Body: { referrer?: string } — the client's document.referrer.
 */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const profile = findProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id: visitorId, isNew } = await getOrCreateVisitorId();
  recordProfileView(profile.id, visitorId);

  // Richer event capture (best-effort — never blocks the view count).
  try {
    const body = (await req.json().catch(() => ({}))) as { referrer?: unknown };
    const viewer = await getSessionUser();
    // Don't log the owner viewing their own card.
    const viewerUserId = viewer && viewer.id !== profile.user_id ? viewer.id : null;
    const country =
      req.headers.get("cf-ipcountry") ?? // Cloudflare edge
      req.headers.get("x-vercel-ip-country") ?? // (fallback)
      null;
    recordViewEvent({
      profile_id: profile.id,
      visitor_id: visitorId,
      viewer_user_id: viewerUserId,
      referrer: referrerHost(body.referrer),
      country: country && country !== "XX" ? country : null,
    });
  } catch {
    // analytics is best-effort
  }

  const views = countProfileViews(profile.id);

  const res = NextResponse.json({ views });
  if (isNew) {
    const opts = visitorCookieOptions();
    res.cookies.set(opts.name, visitorId, opts);
  }
  return res;
}
