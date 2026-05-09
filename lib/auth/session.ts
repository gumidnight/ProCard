import { cookies } from "next/headers";
import crypto from "node:crypto";
import { config } from "@/lib/env";
import type { UserRow } from "@/types/db";
import { findUserById } from "@/lib/db/users";

// ---------------------------------------------------------------------------
// Session management
// For local dev: in-memory Map (cleared on server restart)
// For production: Cloudflare KV with 7-day TTL
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "rankcard_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionData {
  userId: string;
  createdAt: number;
}

// In-memory session store for local development
const sessionStore = new Map<string, SessionData>();

/**
 * Create a new session for a user and set the cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const data: SessionData = {
    userId,
    createdAt: Math.floor(Date.now() / 1000),
  };

  // Sign the token with HMAC to prevent tampering
  const signed = signToken(token);

  sessionStore.set(token, data);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });

  return token;
}

/**
 * Get the current user from the session cookie.
 * Returns null if no valid session exists.
 */
export async function getSessionUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const signed = cookieStore.get(SESSION_COOKIE)?.value;
  if (!signed) return null;

  const token = verifyToken(signed);
  if (!token) return null;

  const session = sessionStore.get(token);
  if (!session) return null;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now - session.createdAt > SESSION_TTL) {
    sessionStore.delete(token);
    return null;
  }

  return findUserById(session.userId);
}

/**
 * Destroy the current session.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const signed = cookieStore.get(SESSION_COOKIE)?.value;

  if (signed) {
    const token = verifyToken(signed);
    if (token) sessionStore.delete(token);
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ---------------------------------------------------------------------------
// HMAC signing — prevents session fixation via forged cookie values
// ---------------------------------------------------------------------------

function signToken(token: string): string {
  const hmac = crypto
    .createHmac("sha256", config.session.secret)
    .update(token)
    .digest("hex");
  return `${token}.${hmac}`;
}

function verifyToken(signed: string): string | null {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const token = signed.slice(0, dotIndex);
  const sig = signed.slice(dotIndex + 1);

  const expected = crypto
    .createHmac("sha256", config.session.secret)
    .update(token)
    .digest("hex");

  // Timing-safe comparison
  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;

  if (crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return token;
  }
  return null;
}
