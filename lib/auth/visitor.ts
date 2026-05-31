import crypto from "node:crypto";
import { cookies } from "next/headers";
import { config } from "@/lib/env";

const VISITOR_COOKIE = "procard_visitor";
const VISITOR_TTL = 60 * 60 * 24 * 365; // 1 year

function signVisitorId(id: string): string {
  const hmac = crypto
    .createHmac("sha256", config.session.secret)
    .update(id)
    .digest("hex");
  return id + "." + hmac;
}

function verifyVisitorId(signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot === -1) return null;
  const id = signed.slice(0, dot);
  const sig = signed.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", config.session.secret)
    .update(id)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  return id;
}

export async function getOrCreateVisitorId(): Promise<{ id: string; isNew: boolean }> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) {
    const id = verifyVisitorId(existing);
    if (id) return { id, isNew: false };
  }
  return { id: crypto.randomUUID(), isNew: true };
}

export function visitorCookieOptions() {
  return {
    name: VISITOR_COOKIE,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_TTL,
  };
}

/** When isNew === true, callers set the cookie with the signed value. */
export function makeSignedVisitorCookieValue(id: string): string {
  return signVisitorId(id);
}
