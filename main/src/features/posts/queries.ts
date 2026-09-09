import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, postCategories, postTags, posts, tags } from "@db/schema";
import { slugify } from "@/lib/utils/slug";
import { mediaUrl } from "@/lib/utils/media-url";

export type PublicArticle = {
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
  width?: number;
  height?: number;
};

export type FullArticle = PublicArticle & { html: string };

export const listArticles = cache(async (): Promise<PublicArticle[]> => {
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      date: posts.publishedAt,
      category: postCategories.name,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      width: mediaAssets.width,
      height: mediaAssets.height,
      excerpt: posts.excerpt,
      sortOrder: posts.sortOrder,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.sortOrder))
    // The news page filters in the browser, so it wants every article. The cap stops an unbounded
    // table taking the page down.
    .limit(500);

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: row.date ? row.date.toISOString().slice(0, 10) : "",
    category: row.category ?? "",
    image: mediaUrl(row, 960),
    excerpt: row.excerpt ?? "",
    width: row.width ?? undefined,
    height: row.height ?? undefined,
  }));
});

// One row at a time: the body is only rendered here, not on the pages that show cards.
export const getArticle = cache(async (slug: string): Promise<FullArticle | undefined> => {
  const [row] = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      date: posts.publishedAt,
      category: postCategories.name,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      width: mediaAssets.width,
      height: mediaAssets.height,
      excerpt: posts.excerpt,
      html: posts.bodyHtml,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!row) return undefined;
  return {
    slug: row.slug,
    title: row.title,
    date: row.date ? row.date.toISOString().slice(0, 10) : "",
    category: row.category ?? "",
    image: mediaUrl(row, 960),
    excerpt: row.excerpt ?? "",
    html: row.html ?? "",
    width: row.width ?? undefined,
    height: row.height ?? undefined,
  };
});

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
