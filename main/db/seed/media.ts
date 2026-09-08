import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { db } from "../client";
import { mediaAssets } from "../schema";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function walk(dir: string, base = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await walk(join(dir, entry.name), rel)));
    } else if (MIME[extname(entry.name).toLowerCase()]) {
      files.push(rel);
    }
  }
  return files;
}

export async function seedMedia(publicDir: string) {
  const files = await walk(publicDir);

  const rows = files.map((path) => {
    const ext = extname(path).toLowerCase();
    return {
      kind: "static" as const,
      type: MIME[ext].startsWith("video") ? "video" : "image",
      staticPath: `/${path}`,
      filename: path.split("/").pop()!,
      mimeType: MIME[ext],
      // The top folder is how the admin media library groups these.
      folder: path.includes("/") ? path.split("/")[0] : "general",
    };
  });

  for (const row of rows) {
    await db
      .insert(mediaAssets)
      .values(row)
      .onConflictDoUpdate({
        target: mediaAssets.staticPath,
        set: { mimeType: row.mimeType, folder: row.folder, updatedAt: new Date() },
      });
  }
  return rows.length;
}
