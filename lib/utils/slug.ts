// ---------------------------------------------------------------------------
// Slug validation and sanitisation
// ---------------------------------------------------------------------------

const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "admin",
  "dashboard",
  "onboarding",
  "login",
  "logout",
  "settings",
  "support",
  "about",
  "blog",
  "pricing",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/;

/**
 * Validate a slug — 3–24 chars, lowercase alphanumeric + hyphens/underscores.
 */
export function isValidSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (slug.length < 3) {
    return { valid: false, error: "Slug must be at least 3 characters" };
  }
  if (slug.length > 24) {
    return { valid: false, error: "Slug must be 24 characters or less" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { valid: false, error: "This slug is reserved" };
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Only lowercase letters, numbers, hyphens, and underscores allowed",
    };
  }
  return { valid: true };
}

/**
 * Sanitise a Discord username into a valid slug suggestion.
 */
export function sanitiseUsernameToSlug(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24)
    .replace(/^[-_]+/, "")
    .replace(/[-_]+$/, "");
}
