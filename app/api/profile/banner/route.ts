import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId, updateProfile } from "@/lib/db/profiles";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// Mirrors app/api/profile/avatar/route.ts — local-disk dev pattern.
// Banners are wide hero strips; recommend ~1500×500 source images.
const UPLOADS_DIR = path.join(process.cwd(), ".wrangler", "state", "banners");
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function ensureDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function bannerUrl(key: string): string {
  return `/api/profile/banner?key=${encodeURIComponent(key)}`;
}

/**
 * POST /api/profile/banner
 * Body: multipart/form-data with field "file" (JPEG, PNG, WebP ≤ 4 MB).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File must be JPEG, PNG or WebP" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 4 MB" }, { status: 400 });
  }

  ensureDir();

  // Remove previous banner
  if (profile.banner_key) {
    try {
      fs.unlinkSync(path.join(UPLOADS_DIR, profile.banner_key));
    } catch {
      /* already gone */
    }
  }

  const ext = EXT_MAP[file.type];
  const key = `${profile.id}-${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, key), Buffer.from(await file.arrayBuffer()));

  const updated = updateProfile(profile.id, { banner_key: key });
  return NextResponse.json({ profile: updated, bannerUrl: bannerUrl(key) });
}

/**
 * GET /api/profile/banner?key=…
 * Streams a stored banner file.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  // Prevent path traversal
  if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, key);
  if (!fs.existsSync(filePath)) return new Response("Not found", { status: 404 });

  const ext = path.extname(key).slice(1);
  const mime = MIME_MAP[ext] ?? "application/octet-stream";
  const data = fs.readFileSync(filePath);

  return new Response(data, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * DELETE /api/profile/banner
 * Removes the uploaded banner.
 */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  if (profile.banner_key) {
    try {
      fs.unlinkSync(path.join(UPLOADS_DIR, profile.banner_key));
    } catch {
      /* already gone */
    }
  }

  const updated = updateProfile(profile.id, { banner_key: null });
  return NextResponse.json({ profile: updated });
}
