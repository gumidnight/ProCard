import { type NextRequest } from "next/server";
import { getStorage } from "@/lib/storage";

interface Params {
  params: Promise<{ key: string }>;
}

/** GET /api/assets/[key] — serves local uploads in dev. In production assets are served from cdn.procard.gg. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { key } = await params;
  if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }
  const obj = await getStorage().get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.bytes, {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
