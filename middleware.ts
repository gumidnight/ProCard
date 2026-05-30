import { NextRequest, NextResponse } from "next/server";

// Paths that require authentication
const PROTECTED_PATHS = ["/onboarding", "/dashboard"];

// Paths that are auth API routes (don't redirect, just 401)
const AUTH_API_PATHS = ["/api/profile", "/api/connect", "/api/ranks"];

// Public engagement endpoints under /api/profile/[slug]/* — anonymous
// visitors hit these (they use a visitor cookie, not a session).
const PUBLIC_API_PATTERN = /^\/api\/profile\/[^/]+\/(view|like|social-click|comments)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("procard_session")?.value;

  // Check if path needs protection
  const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedApi =
    AUTH_API_PATHS.some((p) => pathname.startsWith(p)) &&
    !PUBLIC_API_PATTERN.test(pathname);

  if (!sessionCookie && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!sessionCookie && isProtectedApi) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/api/profile/:path*",
    "/api/connect/:path*",
    "/api/ranks/:path*",
  ],
};
