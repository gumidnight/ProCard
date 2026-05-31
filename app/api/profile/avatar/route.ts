import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { findProfileByUserId, updateProfile } from "@/lib/db/profiles";
import { getStorage } from "@/lib/storage";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function detectImageType(
  bytes: ArrayBuffer,
): { contentType: string; ext: string } | null {
  const v = new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength));
  if (v[0] === 0xff && v[1] === 0xd8 && v[2] === 0xff)
    return { contentType: "image/jpeg", ext: "jpg" };
  if (v[0] === 0x89 && v[1] === 0x50 && v[2] === 0x4e && v[3] === 0x47)
    return { contentType: "image/png", ext: "png" };
  if (
    v[0] === 0x52 &&
    v[1] === 0x49 &&
    v[2] === 0x46 &&
    v[3] === 0x46 &&
    v[8] === 0x57 &&
    v[9] === 0x45 &&
    v[10] === 0x42 &&
    v[11] === 0x50
  )
    return { contentType: "image/webp", ext: "webp" };
  return null;
}

/** POST /api/profile/avatar — multipart/form-data field "file" (JPEG, PNG, WebP ≤ 2 MB). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();

  const imageType = detectImageType(bytes);
  if (!imageType)
    return NextResponse.json(
      { error: "File must be JPEG, PNG or WebP" },
      { status: 400 },
    );
  if (bytes.byteLength > MAX_SIZE)
    return NextResponse.json({ error: "File must be under 2 MB" }, { status: 400 });

  const storage = getStorage();
  if (profile.avatar_key) await storage.delete(profile.avatar_key);

  const key = `avatars/${profile.id}-${crypto.randomUUID()}.${imageType.ext}`;
  await storage.put(key, bytes, imageType.contentType);

  const updated = await updateProfile(profile.id, { avatar_key: key });
  return NextResponse.json({ profile: updated, avatarUrl: storage.publicUrl(key) });
}

/** DELETE /api/profile/avatar — removes custom avatar and falls back to Discord avatar. */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await findProfileByUserId(user.id);
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  if (profile.avatar_key) await getStorage().delete(profile.avatar_key);
  const updated = await updateProfile(profile.id, { avatar_key: null });
  return NextResponse.json({ profile: updated });
}
