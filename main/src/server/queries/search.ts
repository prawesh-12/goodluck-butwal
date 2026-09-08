import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
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
import { groupHits, searchTerm, type SearchGroup } from "@/components/search/query";

const PER_GROUP = 12;

const on = (published: Date | null, created: Date) =>
  (published ?? created).toISOString().slice(0, 10);

const levelLabel = (level: string | null) =>
  LEVELS.find((l) => l.value === level)?.label ?? "";

const serviceLabels: Record<string, string> = {
  education: "Education",
  study_abroad: "Study abroad",
  test_prep: "Test preparation",
  migration: "Migration",
};

// Plain ILIKE across the six things a visitor can land on, one query each, run together.
export async function search(raw: string | string[] | undefined): Promise<SearchGroup[]> {
  const term = searchTerm(raw);
  if (!term) return [];
  const like = term.pattern;

  const [courseRows, institutionRows, postRows, destinationRows, serviceRows, eventRows] =
    await Promise.all([
      db
        .select({
          slug: courses.slug,
          name: courses.name,
          level: courses.qualificationLevel,
          publishedAt: courses.publishedAt,
          createdAt: courses.createdAt,
          institution: institutions.name,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
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
        .orderBy(asc(courses.name))
        .limit(PER_GROUP),

      db
        .select({
          slug: institutions.slug,
          name: institutions.name,
          city: institutions.city,
          country: institutions.country,
          publishedAt: institutions.publishedAt,
          createdAt: institutions.createdAt,
          destination: destinations.name,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
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
        .orderBy(asc(institutions.name))
        .limit(PER_GROUP),

      db
        .select({
          slug: posts.slug,
          title: posts.title,
          excerpt: posts.excerpt,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          category: postCategories.name,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        })
        .from(posts)
        .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
        .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
        .where(
          and(
            eq(posts.status, "published"),
            or(ilike(posts.title, like), ilike(posts.excerpt, like)),
          ),
        )
        .orderBy(desc(posts.publishedAt))
        .limit(PER_GROUP),

      db
        .select({
          slug: destinations.slug,
          name: destinations.name,
          tagline: destinations.tagline,
          publishedAt: destinations.publishedAt,
          createdAt: destinations.createdAt,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
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
        .orderBy(asc(destinations.sortOrder))
        .limit(PER_GROUP),

      db
        .select({
          slug: services.slug,
          name: services.name,
          summary: services.summary,
          category: services.category,
          publishedAt: services.publishedAt,
          createdAt: services.createdAt,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        })
        .from(services)
        .leftJoin(mediaAssets, eq(services.artworkId, mediaAssets.id))
        .where(
          and(
            eq(services.status, "published"),
            or(ilike(services.name, like), ilike(services.summary, like)),
          ),
        )
        .orderBy(asc(services.sortOrder))
        .limit(PER_GROUP),

      db
        .select({
          slug: events.slug,
          title: events.title,
          summary: events.summary,
          eventType: events.eventType,
          startsAt: events.startsAt,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        })
        .from(events)
        .leftJoin(mediaAssets, eq(events.coverImageId, mediaAssets.id))
        .where(
          and(
            eq(events.status, "published"),
            or(ilike(events.title, like), ilike(events.summary, like)),
          ),
        )
        .orderBy(desc(events.startsAt))
        .limit(PER_GROUP),
    ]);

  return groupHits([
    ...courseRows.map((row) => ({
      kind: "courses" as const,
      href: `/courses/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.name,
        date: on(row.publishedAt, row.createdAt),
        category: levelLabel(row.level),
        image: mediaUrl(row, 640),
        excerpt: row.institution,
      },
    })),
    ...institutionRows.map((row) => ({
      kind: "institutions" as const,
      href: `/institutions/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.name,
        date: on(row.publishedAt, row.createdAt),
        category: row.destination ?? row.country ?? "",
        image: mediaUrl(row, 640),
        excerpt: [row.city, row.country].filter(Boolean).join(", "),
      },
    })),
    ...postRows.map((row) => ({
      kind: "posts" as const,
      href: `/news/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.title,
        date: on(row.publishedAt, row.createdAt),
        category: row.category ?? "",
        image: mediaUrl(row, 960),
        excerpt: row.excerpt ?? "",
      },
    })),
    ...destinationRows.map((row) => ({
      kind: "destinations" as const,
      href: `/study-abroad/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.name,
        date: on(row.publishedAt, row.createdAt),
        category: row.name,
        image: mediaUrl(row, 640),
        excerpt: row.tagline ?? "",
      },
    })),
    ...serviceRows.map((row) => ({
      kind: "services" as const,
      href: `/services/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.name,
        date: on(row.publishedAt, row.createdAt),
        category: serviceLabels[row.category] ?? "",
        image: mediaUrl(row, 640),
        excerpt: row.summary ?? "",
      },
    })),
    ...eventRows.map((row) => ({
      kind: "events" as const,
      href: `/events/${row.slug}`,
      article: {
        slug: row.slug,
        title: row.title,
        date: row.startsAt.toISOString().slice(0, 10),
        category: eventTypeLabels[row.eventType],
        image: mediaUrl(row, 640),
        excerpt: row.summary ?? "",
      },
    })),
  ]);
}
