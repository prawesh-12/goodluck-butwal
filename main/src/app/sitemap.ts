import type { MetadataRoute } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import {
  courses,
  destinations,
  events,
  institutions,
  offices,
  pages,
  postCategories,
  posts,
  services,
  tags,
  teamMembers,
  testPrepCourses,
} from "@db/schema";
import { company } from "@/config/site";

type Frequency = "weekly" | "monthly" | "yearly";

const url = (path: string) => `${company.url}${path}`;

const fixed = [
  "",
  "/about",
  "/about/team",
  "/about/offices",
  "/about/message-from-co-founders",
  "/about/corporate-social-responsibility",
  "/about/careers",
  "/study-abroad",
  "/institutions",
  "/courses",
  "/services",
  "/test-preparation",
  "/test-preparation/batches",
  "/events",
  "/success-stories",
  "/news",
  "/faq",
  "/contact",
  "/contact/book-consultation",
];

const sources = [
  { table: destinations, prefix: "/study-abroad", frequency: "monthly" as Frequency, extra: eq(destinations.hasPage, true) },
  { table: services, prefix: "/services", frequency: "monthly" as Frequency, extra: undefined },
  { table: posts, prefix: "/news", frequency: "yearly" as Frequency, extra: undefined },
  { table: institutions, prefix: "/institutions", frequency: "monthly" as Frequency, extra: undefined },
  { table: courses, prefix: "/courses", frequency: "monthly" as Frequency, extra: undefined },
  { table: testPrepCourses, prefix: "/test-preparation", frequency: "monthly" as Frequency, extra: undefined },
  { table: events, prefix: "/events", frequency: "weekly" as Frequency, extra: undefined },
  { table: pages, prefix: "/legal", frequency: "yearly" as Frequency, extra: eq(pages.parent, "legal") },
  { table: offices, prefix: "/offices", frequency: "monthly" as Frequency, extra: undefined },
  { table: teamMembers, prefix: "/team", frequency: "monthly" as Frequency, extra: undefined },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [records, categories, tagRows] = await Promise.all([
    Promise.all(
      sources.map(async ({ table, prefix, frequency, extra }) => {
        const rows = await db
          .select({ slug: table.slug, updatedAt: table.updatedAt, noindex: table.seoNoindex })
          .from(table)
          .where(and(eq(table.status, "published"), extra));
        return rows
          .filter((row) => !row.noindex)
          .map((row) => ({
            url: url(`${prefix}/${row.slug}`),
            lastModified: row.updatedAt,
            changeFrequency: frequency,
          }));
      }),
    ),
    db
      .select({ slug: postCategories.slug, updatedAt: postCategories.updatedAt })
      .from(postCategories)
      .orderBy(asc(postCategories.sortOrder)),
    db.select({ slug: tags.slug, updatedAt: tags.updatedAt }).from(tags),
  ]);

  return [
    ...fixed.map((path) => ({ url: url(path), changeFrequency: "monthly" as const })),
    ...records.flat(),
    ...categories.map((row) => ({
      url: url(`/news/category/${row.slug}`),
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
    })),
    ...tagRows.map((row) => ({
      url: url(`/news/tag/${row.slug}`),
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
