import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, postCategories, posts, settings, testimonials } from "@db/schema";

export type PublicArticle = {
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
  html: string;
  width?: number;
  height?: number;
};

export const listArticles = cache(async (): Promise<PublicArticle[]> => {
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      date: posts.publishedAt,
      category: postCategories.name,
      image: mediaAssets.staticPath,
      width: mediaAssets.width,
      height: mediaAssets.height,
      excerpt: posts.excerpt,
      html: posts.bodyHtml,
      sortOrder: posts.sortOrder,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.sortOrder));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: row.date ? row.date.toISOString().slice(0, 10) : "",
    category: row.category ?? "",
    image: row.image ?? "",
    excerpt: row.excerpt ?? "",
    html: row.html ?? "",
    width: row.width ?? undefined,
    height: row.height ?? undefined,
  }));
});

export const getArticle = cache(async (slug: string) =>
  (await listArticles()).find((article) => article.slug === slug),
);

export type PublicReview = { name: string; avatar: string; date: string; quote: string };

// Nothing is published until consent is recorded, which is why these can come back empty.
export const listReviews = cache(async (): Promise<PublicReview[]> => {
  const rows = await db
    .select({
      name: testimonials.displayName,
      avatar: mediaAssets.staticPath,
      quote: testimonials.quote,
      createdAt: testimonials.publishedAt,
    })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.authorPhotoId, mediaAssets.id))
    .where(and(eq(testimonials.status, "published"), eq(testimonials.type, "text")))
    .orderBy(asc(testimonials.sortOrder));

  return rows.map((row) => ({
    name: row.name ?? "",
    avatar: row.avatar ?? "",
    date: row.createdAt ? row.createdAt.toISOString().slice(0, 7) : "",
    quote: row.quote ?? "",
  }));
});

export const listSuccessStories = cache(async (): Promise<{ image: string; alt: string }[]> => {
  const rows = await db
    .select({ image: mediaAssets.staticPath, alt: testimonials.displayName })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.imageId, mediaAssets.id))
    .where(and(eq(testimonials.status, "published"), eq(testimonials.type, "image")))
    .orderBy(asc(testimonials.sortOrder));

  return rows.map((row) => ({ image: row.image ?? "", alt: row.alt ?? "" }));
});

export const getGoogleRating = cache(async () => {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return {
    score: String(byKey.get("google_rating") ?? ""),
    count: Number(byKey.get("google_review_count") ?? 0),
  };
});

export type GoogleRating = Awaited<ReturnType<typeof getGoogleRating>>;
