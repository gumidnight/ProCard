import { describe, expect, it } from "vitest";
import { isValidSlug, sanitiseUsernameToSlug } from "@/lib/utils/slug";

describe("isValidSlug", () => {
  it("accepts well-formed slugs", () => {
    for (const s of ["faker", "t1-zeus", "g2_caps", "abc", "a1b2c3"]) {
      expect(isValidSlug(s).valid, s).toBe(true);
    }
  });

  it("rejects too short / too long", () => {
    expect(isValidSlug("ab").valid).toBe(false);
    expect(isValidSlug("a".repeat(25)).valid).toBe(false);
  });

  it("rejects reserved slugs", () => {
    for (const s of ["api", "admin", "dashboard", "login"]) {
      expect(isValidSlug(s).valid, s).toBe(false);
    }
  });

  it("rejects illegal characters and edge punctuation", () => {
    for (const s of [
      "Faker",
      "has space",
      "emoji😀x",
      "-lead",
      "trail-",
      "_lead",
      "dot.dot",
    ]) {
      expect(isValidSlug(s).valid, s).toBe(false);
    }
  });
});

describe("sanitiseUsernameToSlug", () => {
  it("lowercases, strips illegal chars, and trims edge separators", () => {
    expect(sanitiseUsernameToSlug("Faker#0001")).toBe("faker0001");
    // disallowed chars (incl. spaces) are stripped, not split on; edge _/- trimmed
    expect(sanitiseUsernameToSlug("__Hello World__")).toBe("helloworld");
    expect(sanitiseUsernameToSlug("T1.Zeus")).toBe("t1zeus");
  });

  it("caps length at 24 characters", () => {
    expect(sanitiseUsernameToSlug("a".repeat(40)).length).toBeLessThanOrEqual(24);
  });
});
