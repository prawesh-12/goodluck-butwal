import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, testimonials } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";

export type PublicReview = { name: string; avatar: string; date: string; quote: string };

export const listReviews = cache(async (): Promise<PublicReview[]> => {
  const rows = await db
    .select({
      name: testimonials.displayName,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      quote: testimonials.quote,
      createdAt: testimonials.publishedAt,
    })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.authorPhotoId, mediaAssets.id))
    .where(
      and(eq(testimonials.status, "published"), eq(testimonials.type, "text")),
    )
    .orderBy(asc(testimonials.sortOrder));

  return rows.map((row) => ({
    name: row.name ?? "",
    avatar: mediaUrl(row, 96),
    date: row.createdAt ? row.createdAt.toISOString().slice(0, 7) : "",
    quote: row.quote ?? "",
  }));
});

export const listSuccessStories = cache(async (): Promise<{ image: string; alt: string }[]> => {
  const rows = await db
    .select({
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      alt: testimonials.displayName,
    })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.imageId, mediaAssets.id))
    .where(
      and(eq(testimonials.status, "published"), eq(testimonials.type, "image")),
    )
    .orderBy(asc(testimonials.sortOrder));

  return rows.map((row) => ({ image: mediaUrl(row, 640), alt: row.alt ?? "" }));
});
