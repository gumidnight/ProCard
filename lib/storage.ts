import path from "node:path";
import fs from "node:fs";

// Minimal R2-like interface (matches Cloudflare R2Bucket API)
interface R2LikeBucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  delete(key: string): Promise<void>;
}

interface StorageAdapter {
  put(key: string, bytes: ArrayBuffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

// ── R2 adapter (production) ──────────────────────────────────────────────────
function createR2Adapter(bucket: R2LikeBucket, assetBaseUrl: string): StorageAdapter {
  return {
    async put(key, bytes, contentType) {
      await bucket.put(key, bytes, {
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
    },
    async get(key) {
      const obj = await bucket.get(key);
      if (!obj) return null;
      const bytes = await obj.arrayBuffer();
      const ext = key.split(".").pop() ?? "bin";
      const MIME: Record<string, string> = {
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      return { bytes, contentType: MIME[ext] ?? "application/octet-stream" };
    },
    async delete(key) {
      await bucket.delete(key);
    },
    publicUrl(key) {
      return `${assetBaseUrl}/${key}`;
    },
  };
}

// ── Local-disk adapter (dev) ─────────────────────────────────────────────────
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), ".wrangler", "state", "uploads");

function createLocalAdapter(): StorageAdapter {
  function ensureDir() {
    if (!fs.existsSync(LOCAL_UPLOADS_DIR))
      fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
  return {
    async put(key, bytes, contentType) {
      ensureDir();
      const safe = key.replace(/\//g, "_");
      fs.writeFileSync(path.join(LOCAL_UPLOADS_DIR, safe), Buffer.from(bytes));
      fs.writeFileSync(path.join(LOCAL_UPLOADS_DIR, safe + ".mime"), contentType);
    },
    async get(key) {
      const safe = key.replace(/\//g, "_");
      const p = path.join(LOCAL_UPLOADS_DIR, safe);
      if (!fs.existsSync(p)) return null;
      const bytes = fs.readFileSync(p).buffer as ArrayBuffer;
      const mimeFile = p + ".mime";
      const contentType = fs.existsSync(mimeFile)
        ? fs.readFileSync(mimeFile, "utf-8")
        : "application/octet-stream";
      return { bytes, contentType };
    },
    async delete(key) {
      const safe = key.replace(/\//g, "_");
      const p = path.join(LOCAL_UPLOADS_DIR, safe);
      try {
        fs.unlinkSync(p);
      } catch {}
      try {
        fs.unlinkSync(p + ".mime");
      } catch {}
    },
    publicUrl(key) {
      return `/api/assets/${encodeURIComponent(key)}`;
    },
  };
}

// ── Public factory ────────────────────────────────────────────────────────────
export function getStorage(): StorageAdapter {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as { env: Record<string, unknown> };
    if (env.BUCKET) {
      const assetBase = process.env.ASSET_BASE_URL ?? "https://cdn.procard.gg";
      return createR2Adapter(env.BUCKET as R2LikeBucket, assetBase);
    }
  } catch {}
  return createLocalAdapter();
}
