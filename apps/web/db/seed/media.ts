import { extname } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets } from "@goodluck/db/schema";
import { team } from "./source/team";
import { partnerLogos } from "./source/partners";
import articles from "./source/articles.json";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
};

// Only what a CMS record points at. Everything else under public/ is developer-controlled art
// that the app resolves straight through Cloudinary, so it needs no row here.
function cmsPaths() {
  return [...new Set([...team.map((person) => person.photo), ...partnerLogos, ...articles.map((a) => a.image)])];
}

export async function seedMedia() {
  const rows = cmsPaths().map((path) => ({
    kind: "static" as const,
    type: "image",
    staticPath: path,
    filename: path.split("/").pop()!,
    mimeType: MIME[extname(path).toLowerCase()] ?? "image/webp",
    folder: path.split("/")[2] ?? "general",
  }));

  await db
    .insert(mediaAssets)
    .values(rows)
    .onConflictDoUpdate({
      target: mediaAssets.staticPath,
      set: { mimeType: sql`excluded.mime_type`, folder: sql`excluded.folder`, updatedAt: new Date() },
    });
  return rows.length;
}
