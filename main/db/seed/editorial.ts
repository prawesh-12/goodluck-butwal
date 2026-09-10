import { db } from "@db/client";
import { mediaAssets, postCategories, posts, settings } from "@db/schema";
import { slugify } from "@/lib/utils/slug";
import articles from "./source/articles.json";
import { googleRating } from "./source/stories";

async function mediaIdByPath() {
  const rows = await db.select({ id: mediaAssets.id, path: mediaAssets.staticPath }).from(mediaAssets);
  return new Map(rows.map((row) => [row.path, row.id]));
}

export async function seedPostCategories() {
  const names = [...new Set(articles.map((a) => a.category))].sort();

  for (const [index, name] of names.entries()) {
    const row = { slug: slugify(name), name, sortOrder: index };
    await db
      .insert(postCategories)
      .values(row)
      .onConflictDoUpdate({ target: postCategories.slug, set: { ...row, updatedAt: new Date() } });
  }
  return names.length;
}

export async function seedPosts() {
  const media = await mediaIdByPath();
  const categories = await db
    .select({ id: postCategories.id, slug: postCategories.slug })
    .from(postCategories);
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));

  for (const [index, article] of articles.entries()) {
    const row = {
      // Frozen. These are live URLs.
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      bodyHtml: article.html,
      bannerImageId: media.get(article.image) ?? null,
      categoryId: categoryId.get(slugify(article.category)) ?? null,
      readingMinutes: Math.max(1, Math.round(article.words / 200)),
      status: "published" as const,
      publishedAt: new Date(article.date),
      sortOrder: index,
    };

    await db
      .insert(posts)
      .values(row)
      .onConflictDoUpdate({ target: posts.slug, set: { ...row, updatedAt: new Date() } });
  }
  return articles.length;
}

export async function seedRating() {
  const rows = [
    { key: "google_rating", value: googleRating.score },
    { key: "google_review_count", value: googleRating.count },
  ];
  for (const row of rows) {
    await db.insert(settings).values(row).onConflictDoNothing({ target: settings.key });
  }
  return rows.length;
}
