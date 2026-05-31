import { NextResponse } from "next/server";
import { findProfileBySlug } from "@/lib/db/profiles";
import {
  toggleProfileLike,
  countProfileLikes,
  hasVisitorLiked,
} from "@/lib/db/engagement";
import {
  getOrCreateVisitorId,
  visitorCookieOptions,
  makeSignedVisitorCookieValue,
} from "@/lib/auth/visitor";

interface Params {
  params: Promise<{ slug: string }>;
}

/** GET — current like state for the visitor. */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const profile = await findProfileBySlug(slug);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id: visitorId, isNew } = await getOrCreateVisitorId();
  const liked = await hasVisitorLiked(profile.id, visitorId);
  const total = await countProfileLikes(profile.id);
  const res = NextResponse.json({ liked, total });
  if (isNew) {
    const opts = visitorCookieOptions();
    res.cookies.set(opts.name, makeSignedVisitorCookieValue(visitorId), opts);
  }
  return res;
}

/** POST — toggle like for the visitor. */
export async function POST(_req: Request, { params }: Params) {
  const { slug } = await params;
  const profile = await findProfileBySlug(slug);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id: visitorId, isNew } = await getOrCreateVisitorId();
  const { liked, total } = await toggleProfileLike(profile.id, visitorId);
  const res = NextResponse.json({ liked, total });
  if (isNew) {
    const opts = visitorCookieOptions();
    res.cookies.set(opts.name, makeSignedVisitorCookieValue(visitorId), opts);
  }
  return res;
}
