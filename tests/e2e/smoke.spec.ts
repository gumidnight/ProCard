import { expect, test } from "@playwright/test";

// Phase-0 smoke coverage. Expand in Phase 5 with the full
// onboarding -> publish -> view -> like/comment journey
// (see docs/cloudflare/CICD-AND-TESTING.md §6).

test("marketing landing page renders", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/ProCard/i);
});

test("unauthenticated /api/auth/me is not authorized", async ({ request }) => {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(401);
});
