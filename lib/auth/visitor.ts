import { cookies } from "next/headers";
import crypto from "node:crypto";

const VISITOR_COOKIE = "procard_visitor";
const VISITOR_TTL = 60 * 60 * 24 * 365; // 1 year

/**
 * Get the anonymous visitor id from the cookie, or create one.
 * Returns `{ id, isNew }`. When `isNew`, the caller is responsible for
 * setting the cookie on the outgoing response (via `setVisitorCookie`).
 */
export async function getOrCreateVisitorId(): Promise<{
  id: string;
  isNew: boolean;
}> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return { id: existing, isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

export function visitorCookieOptions() {
  return {
    name: VISITOR_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_TTL,
  };
}
