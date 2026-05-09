import { cookies } from "next/headers";
import crypto from "node:crypto";
import { config } from "@/lib/env";
import type { UserRow } from "@/types/db";
import { findUserById } from "@/lib/db/users";

// ---------------------------------------------------------------------------
// Stateless session management
// Cookie value = userId:createdAt.hmac — no server-side store needed.
// HMAC prevents tampering; createdAt enforces TTL.
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "rankcard_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Create a new session for a user.
 * Returns the cookie name/value/options so the caller can set it on a response.
 */
export function createSession(userId: string): {
  cookieName: string;
  cookieValue: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
} {
  const createdAt = Math.floor(Date.now() / 1000);
  const payload = `${userId}:${createdAt}`;
  const signed = signPayload(payload);

  return {
    cookieName: SESSION_COOKIE,
    cookieValue: signed,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL,
    },
  };
}

/**
 * Get the current user from the session cookie.
 * Returns null if no valid session exists.
 */
export async function getSessionUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const signed = cookieStore.get(SESSION_COOKIE)?.value;
  if (!signed) return null;

  const payload = verifyPayload(signed);
  if (!payload) return null;

  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return null;

  const userId = payload.slice(0, colonIdx);
  const createdAt = parseInt(payload.slice(colonIdx + 1), 10);
  if (isNaN(createdAt)) return null;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now - createdAt > SESSION_TTL) return null;

  return findUserById(userId);
}

/**
 * Destroy the current session.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ---------------------------------------------------------------------------
// HMAC signing — payload.hmac
// ---------------------------------------------------------------------------

function signPayload(payload: string): string {
  const hmac = crypto
    .createHmac("sha256", config.session.secret)
    .update(payload)
    .digest("hex");
  return `${payload}.${hmac}`;
}

function verifyPayload(signed: string): string | null {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = signed.slice(0, dotIndex);
  const sig = signed.slice(dotIndex + 1);

  const expected = crypto
    .createHmac("sha256", config.session.secret)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;

  if (crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return payload;
  }
  return null;
}
