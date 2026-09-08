import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@db/client";
import {
  courses,
  destinations,
  events,
  institutions,
  mediaAssets,
  postCategories,
  posts,
  services,
} from "@db/schema";
import { LEVELS } from "@/components/catalogue/filters";
import { eventTypeLabels } from "@/lib/content-meta";
import { mediaUrl } from "@/server/queries/catalogue";
import { groupHits, searchTerm, type SearchGroup, type SearchKind } from "@/components/search/query";

const PER_GROUP = 12;

// Every branch of the union hands back the same ten columns, so the six searches cost one round
// trip. row_number carries each branch's own ordering through, which UNION ALL does not promise.
// The slug breaks ties, otherwise two rows sharing a date make the cut-off at twelve arbitrary.
const media = {
  kind: mediaAssets.kind,
  staticPath: mediaAssets.staticPath,
  cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
};

// to_char at UTC, so the date matches what toISOString() would have given.
const day = (value: SQL) => sql<string>`to_char(${value} at time zone 'UTC', 'YYYY-MM-DD')`.as("on");

const levelLabel = (level: string | null) =>
  LEVELS.find((l) => l.value === level)?.label ?? "";

const serviceLabels: Record<string, string> = {
  education: "Education",
  study_abroad: "Study abroad",
  test_prep: "Test preparation",
  migration: "Migration",
};

type Row = {
  hitKind: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  on: string;
  kind: "static" | "cloudinary" | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  rank: number;
};

const href: Record<SearchKind, (slug: string) => string> = {
  courses: (slug) => `/courses/${slug}`,
  institutions: (slug) => `/institutions/${slug}`,
  posts: (slug) => `/news/${slug}`,
  destinations: (slug) => `/study-abroad/${slug}`,
  services: (slug) => `/services/${slug}`,
  events: (slug) => `/events/${slug}`,
};

const categoryLabel: Record<SearchKind, (raw: string | null) => string> = {
  courses: (raw) => levelLabel(raw),
  institutions: (raw) => raw ?? "",
  posts: (raw) => raw ?? "",
  destinations: (raw) => raw ?? "",
  services: (raw) => serviceLabels[raw ?? ""] ?? "",
  events: (raw) => eventTypeLabels[(raw ?? "") as keyof typeof eventTypeLabels] ?? "",
};

// News cards on the search page are wider than the rest, so their artwork is asked for larger.
const imageWidth = (kind: SearchKind) => (kind === "posts" ? 960 : 640);

// Plain ILIKE across the six things a visitor can land on, run as one query.
export async function search(raw: string | string[] | undefined): Promise<SearchGroup[]> {
  const term = searchTerm(raw);
  if (!term) return [];
  const like = term.pattern;

  const rows = (await unionAll(
    db
      .select({
        hitKind: sql<string>`'courses'`.as("hit_kind"),
        slug: courses.slug,
        title: sql<string>`${courses.name}`.as("title"),
        excerpt: sql<string | null>`${institutions.name}`.as("excerpt"),
        category: sql<string | null>`${courses.qualificationLevel}::text`.as("category"),
        on: day(sql`coalesce(${courses.publishedAt}, ${courses.createdAt})`),
        ...media,
        rank: sql<number>`row_number() over (order by ${courses.name} asc, ${courses.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(courses)
      .innerJoin(institutions, eq(courses.institutionId, institutions.id))
      .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
      .where(
        and(
          eq(courses.status, "published"),
          eq(institutions.status, "published"),
          or(ilike(courses.name, like), ilike(institutions.name, like), ilike(courses.country, like)),
        ),
      )
      .orderBy(asc(courses.name), asc(courses.slug))
      .limit(PER_GROUP),

    db
      .select({
        hitKind: sql<string>`'institutions'`.as("hit_kind"),
        slug: institutions.slug,
        title: sql<string>`${institutions.name}`.as("title"),
        excerpt: sql<string | null>`concat_ws(', ', nullif(${institutions.city}, ''), nullif(${institutions.country}, ''))`.as("excerpt"),
        category: sql<string | null>`coalesce(${destinations.name}, ${institutions.country})`.as("category"),
        on: day(sql`coalesce(${institutions.publishedAt}, ${institutions.createdAt})`),
        ...media,
        rank: sql<number>`row_number() over (order by ${institutions.name} asc, ${institutions.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(institutions)
      .leftJoin(destinations, eq(institutions.destinationId, destinations.id))
      .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
      .where(
        and(
          eq(institutions.status, "published"),
          or(
            ilike(institutions.name, like),
            ilike(institutions.city, like),
            ilike(institutions.country, like),
          ),
        ),
      )
      .orderBy(asc(institutions.name), asc(institutions.slug))
      .limit(PER_GROUP),

    db
      .select({
        hitKind: sql<string>`'posts'`.as("hit_kind"),
        slug: posts.slug,
        title: sql<string>`${posts.title}`.as("title"),
        excerpt: sql<string | null>`${posts.excerpt}`.as("excerpt"),
        category: sql<string | null>`${postCategories.name}`.as("category"),
        on: day(sql`coalesce(${posts.publishedAt}, ${posts.createdAt})`),
        ...media,
        rank: sql<number>`row_number() over (order by ${posts.publishedAt} desc, ${posts.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
      .where(
        and(eq(posts.status, "published"), or(ilike(posts.title, like), ilike(posts.excerpt, like))),
      )
      .orderBy(desc(posts.publishedAt), asc(posts.slug))
      .limit(PER_GROUP),

    db
      .select({
        hitKind: sql<string>`'destinations'`.as("hit_kind"),
        slug: destinations.slug,
        title: sql<string>`${destinations.name}`.as("title"),
        excerpt: sql<string | null>`${destinations.tagline}`.as("excerpt"),
        category: sql<string | null>`${destinations.name}`.as("category"),
        on: day(sql`coalesce(${destinations.publishedAt}, ${destinations.createdAt})`),
        ...media,
        rank: sql<number>`row_number() over (order by ${destinations.sortOrder} asc, ${destinations.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(destinations)
      .leftJoin(mediaAssets, eq(destinations.cardImageId, mediaAssets.id))
      .where(
        and(
          eq(destinations.status, "published"),
          // A destination without its own page routes to the booking form, so it is not a result.
          eq(destinations.hasPage, true),
          or(ilike(destinations.name, like), ilike(destinations.tagline, like)),
        ),
      )
      .orderBy(asc(destinations.sortOrder), asc(destinations.slug))
      .limit(PER_GROUP),

    db
      .select({
        hitKind: sql<string>`'services'`.as("hit_kind"),
        slug: services.slug,
        title: sql<string>`${services.name}`.as("title"),
        excerpt: sql<string | null>`${services.summary}`.as("excerpt"),
        category: sql<string | null>`${services.category}::text`.as("category"),
        on: day(sql`coalesce(${services.publishedAt}, ${services.createdAt})`),
        ...media,
        rank: sql<number>`row_number() over (order by ${services.sortOrder} asc, ${services.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(services)
      .leftJoin(mediaAssets, eq(services.artworkId, mediaAssets.id))
      .where(
        and(
          eq(services.status, "published"),
          or(ilike(services.name, like), ilike(services.summary, like)),
        ),
      )
      .orderBy(asc(services.sortOrder), asc(services.slug))
      .limit(PER_GROUP),

    db
      .select({
        hitKind: sql<string>`'events'`.as("hit_kind"),
        slug: events.slug,
        title: sql<string>`${events.title}`.as("title"),
        excerpt: sql<string | null>`${events.summary}`.as("excerpt"),
        category: sql<string | null>`${events.eventType}::text`.as("category"),
        on: day(sql`${events.startsAt}`),
        ...media,
        rank: sql<number>`row_number() over (order by ${events.startsAt} desc, ${events.slug} asc)`.mapWith(Number).as("rank"),
      })
      .from(events)
      .leftJoin(mediaAssets, eq(events.coverImageId, mediaAssets.id))
      .where(
        and(
          eq(events.status, "published"),
          or(ilike(events.title, like), ilike(events.summary, like)),
        ),
      )
      .orderBy(desc(events.startsAt), asc(events.slug))
      .limit(PER_GROUP),
  )) as Row[];

  return groupHits(
    rows
      .sort((a, b) => a.rank - b.rank)
      .map((row) => {
        const kind = row.hitKind as SearchKind;
        return {
          kind,
          href: href[kind](row.slug),
          article: {
            slug: row.slug,
            title: row.title,
            date: row.on,
            category: categoryLabel[kind](row.category),
            image: mediaUrl(row, imageWidth(kind)),
            excerpt: row.excerpt ?? "",
          },
        };
      }),
  );
}
