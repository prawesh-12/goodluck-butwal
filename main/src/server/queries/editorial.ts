import { cache } from "react";
import { slugify } from "@/lib/slug";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { allSettings } from "./shared";
import { mediaAssets, postCategories, postTags, posts, tags, testimonials } from "@db/schema";

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
    .orderBy(asc(posts.sortOrder))
    // The news page filters by category in the browser, so it genuinely wants every article,
    // and two other pages search the titles. This is the guard that stops an unbounded table
    // from taking a page down. Well above the 31 articles that exist.
    .limit(500);

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
  const byKey = await allSettings();
  return {
    score: String(byKey.get("google_rating") ?? ""),
    count: Number(byKey.get("google_review_count") ?? 0),
  };
});

export type GoogleRating = Awaited<ReturnType<typeof getGoogleRating>>;

export const listArticlesByCategory = cache(async (slug: string) => {
  const all = await listArticles();
  return all.filter((article) => slugify(article.category) === slug);
});

export const listCategories = cache(async () => {
  const rows = await db
    .select({ slug: postCategories.slug, name: postCategories.name })
    .from(postCategories)
    .orderBy(asc(postCategories.sortOrder));
  return rows;
});

export const listArticlesByTag = cache(async (slug: string): Promise<PublicArticle[]> => {
  const ids = await db
    .select({ postId: postTags.postId })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(tags.slug, slug));

  if (ids.length === 0) return [];
  const wanted = new Set(ids.map((row) => row.postId));

  const rows = await db.select({ id: posts.id, slug: posts.slug }).from(posts);
  const slugs = new Set(rows.filter((row) => wanted.has(row.id)).map((row) => row.slug));

  return (await listArticles()).filter((article) => slugs.has(article.slug));
});

export const getTag = cache(async (slug: string) => {
  const [row] = await db.select({ name: tags.name }).from(tags).where(eq(tags.slug, slug));
  return row;
});
