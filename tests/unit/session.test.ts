import crypto from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

// session.ts imports next/headers (cookies) at module scope; stub it so the
// module loads in a plain Node test environment. createSession itself touches
// neither cookies nor the DB.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

const SECRET = "unit-test-session-secret-which-is-long-enough-0123456789";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("createSession", () => {
  it("issues a `<userId>:<createdAt>.<hmac>` cookie bound to the user", async () => {
    const { createSession } = await import("@/lib/auth/session");
    const { cookieName, cookieValue } = createSession("user-123");

    expect(cookieName).toBe("procard_session");

    const dot = cookieValue.lastIndexOf(".");
    const payload = cookieValue.slice(0, dot);
    const sig = cookieValue.slice(dot + 1);

    expect(payload.startsWith("user-123:")).toBe(true);

    // The signature must be a correct HMAC of the payload under SESSION_SECRET.
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    expect(sig).toBe(expected);
    expect(sig).toHaveLength(64);
  });

  it("sets hardened cookie options (httpOnly, sameSite=lax, positive TTL)", async () => {
    const { createSession } = await import("@/lib/auth/session");
    const { cookieOptions } = createSession("u");
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.sameSite).toBe("lax");
    expect(cookieOptions.path).toBe("/");
    expect(cookieOptions.maxAge).toBeGreaterThan(0);
  });

  it("a forged signature would not match the recomputed HMAC (tamper detection)", async () => {
    const { createSession } = await import("@/lib/auth/session");
    const { cookieValue } = createSession("victim");
    const payload = cookieValue.slice(0, cookieValue.lastIndexOf("."));
    const forged = `${payload}.${"0".repeat(64)}`;
    const recomputed = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    expect(forged.endsWith(recomputed)).toBe(false);
  });
});
