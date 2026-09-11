// Re-runnable: an id already on Cloudinary is left alone unless --force is passed.
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { signParams } from "../src/lib/integrations/cloudinary";
import { assetId } from "../src/lib/utils/media-url";

const IMAGE = new Set([".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".avif"]);
const VIDEO = new Set([".mp4", ".webm"]);

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const apiKey = process.env.CLOUDINARY_API_KEY!;
const apiSecret = process.env.CLOUDINARY_API_SECRET!;
const force = process.argv.includes("--force");

async function walk(dir: string, base = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = `${base}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(join(dir, entry.name), rel)));
    else if (IMAGE.has(extname(entry.name).toLowerCase()) || VIDEO.has(extname(entry.name).toLowerCase())) files.push(rel);
  }
  return files;
}

async function upload(path: string) {
  const isVideo = VIDEO.has(extname(path).toLowerCase());
  const resource = isVideo ? "video" : "image";

  const signed: Record<string, string | number> = {
    public_id: assetId(path),
    overwrite: String(force),
    timestamp: Math.floor(Date.now() / 1000),
    // Build the HLS ladder now, so the first person to open a video is not the one who waits.
    ...(isVideo ? { eager: "sp_auto", eager_async: "true" } : {}),
  };

  const body = new FormData();
  body.append("file", new Blob([await readFile(join("public", path.slice(1)))]));
  body.append("api_key", apiKey);
  for (const [key, value] of Object.entries(signed)) body.append(key, String(value));
  body.append("signature", await signParams(signed, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`, { method: "POST", body });
  const result = (await res.json()) as { public_id?: string; bytes?: number; error?: { message: string } };
  if (!res.ok) throw new Error(`${path}: ${result.error?.message ?? res.status}`);
  return { path, publicId: result.public_id!, bytes: result.bytes ?? 0 };
}

async function main() {
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured.");

  const files = await walk("public");
  console.log(`${files.length} files under public/${force ? ", overwriting" : ", skipping what is already there"}`);

  let bytes = 0;
  // Serial on purpose. Cloudinary rate limits a burst and this runs once.
  for (const path of files) {
    const { publicId, bytes: size } = await upload(path);
    bytes += size;
    console.log(`  ${path} -> ${publicId}`);
  }
  console.log(`done, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

void main();
