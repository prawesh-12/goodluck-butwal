import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { destinations, institutions, offices, postCategories, postTags, posts, services, tags } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/auth/rbac";
import { asStatus, PAGE_SIZE, type EditorialFilters } from "@/lib/utils/admin-query";

function postWhere(actor: Actor, f: EditorialFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(posts, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(posts.title, like), ilike(posts.slug, like), ilike(posts.excerpt, like)));
  }
  const status = asStatus(f.status);
  if (status) parts.push(eq(posts.status, status));
  if (f.category) parts.push(eq(posts.categoryId, f.category));
  if (f.office) parts.push(eq(posts.officeId, f.office));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminPosts(actor: Actor, f: EditorialFilters) {
  const where = postWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        publishedAt: posts.publishedAt,
        readingMinutes: posts.readingMinutes,
        category: postCategories.name,
        office: offices.name,
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .leftJoin(offices, eq(posts.officeId, offices.id))
      .where(where)
      .orderBy(desc(posts.publishedAt), asc(posts.title))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(posts).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminPost(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  if (!row) return undefined;

  const chosen = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, id));

  return { ...row, tagIds: chosen.map((t) => t.tagId) };
}

export async function postSlugs() {
  const rows = await db.select({ slug: posts.slug }).from(posts);
  return rows.map((row) => row.slug);
}

export async function listPostCategories() {
  return db
    .select({
      id: postCategories.id,
      slug: postCategories.slug,
      name: postCategories.name,
      description: postCategories.description,
      sortOrder: postCategories.sortOrder,
    })
    .from(postCategories)
    .orderBy(asc(postCategories.sortOrder), asc(postCategories.name));
}

export async function postsPerCategory() {
  const rows = await db
    .select({ categoryId: posts.categoryId, n: count() })
    .from(posts)
    .groupBy(posts.categoryId);
  return new Map(rows.map((row) => [row.categoryId, row.n]));
}

export async function listTags() {
  return db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name));
}

export async function categorySlugs() {
  const rows = await db.select({ slug: postCategories.slug }).from(postCategories);
  return rows.map((row) => row.slug);
}

export async function tagSlugs() {
  const rows = await db.select({ slug: tags.slug }).from(tags);
  return rows.map((row) => row.slug);
}

export async function editorialOptions() {
  const [categories, tagRows, officeRows, destinationRows, serviceRows, institutionRows] =
    await Promise.all([
      listPostCategories(),
      listTags(),
      db.select({ id: offices.id, name: offices.name }).from(offices).orderBy(asc(offices.name)),
      db
        .select({ id: destinations.id, name: destinations.name })
        .from(destinations)
        .orderBy(asc(destinations.name)),
      db.select({ id: services.id, name: services.name }).from(services).orderBy(asc(services.name)),
      db
        .select({ id: institutions.id, name: institutions.name })
        .from(institutions)
        .orderBy(asc(institutions.name)),
    ]);

  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    tags: tagRows,
    offices: officeRows,
    destinations: destinationRows,
    services: serviceRows,
    institutions: institutionRows,
  };
}

export type EditorialOptions = Awaited<ReturnType<typeof editorialOptions>>;
