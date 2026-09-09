import { test, expect } from "vitest";
import { and, count, eq } from "drizzle-orm";
import { db } from "@db/client";
import { courses, institutions } from "@db/schema";
import { listCourseFilterOptions, listCourses } from "@/features/courses/queries";
import { PER_PAGE } from "@/features/courses/filters";

const hasDb = Boolean(process.env.DATABASE_URL);

const sorted = (values: string[]) => [...values].sort((a, b) => a.localeCompare(b));

test.runIf(hasDb)("the three filter lists come back separated and in order", async () => {
  const options = await listCourseFilterOptions();

  expect(options.destinations.length).toBeGreaterThan(0);
  expect(options.categories.length).toBeGreaterThan(0);
  expect(options.institutions.length).toBeGreaterThan(0);

  const slugs = [...options.destinations, ...options.categories, ...options.institutions].map((o) => o.slug);
  expect(new Set(slugs).size).toBe(slugs.length);

  const names = options.institutions.map((i) => i.name);
  expect(names).toEqual(sorted(names));
});

test.runIf(hasDb)("the window count matches a plain count of the same rows", async () => {
  const { rows, total } = await listCourses({ page: 1 });
  const [plain] = await db
    .select({ value: count() })
    .from(courses)
    .innerJoin(institutions, eq(courses.institutionId, institutions.id))
    .where(and(eq(courses.status, "published"), eq(institutions.status, "published")));

  expect(total).toBe(plain.value);
  expect(rows.length).toBeLessThanOrEqual(PER_PAGE);
});

test.runIf(hasDb)("a page past the end returns nothing rather than throwing", async () => {
  const { rows } = await listCourses({ page: 9999 });
  expect(rows).toEqual([]);
});
