import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@db/client";
import {
  courses,
  destinations,
  events,
  institutions,
  offices,
  pages,
  partners,
  posts,
  services,
  teamMembers,
  testPrepCourses,
  testimonials,
} from "@db/schema";
import { writeAudit } from "@/lib/security/audit";
import { isDueToPublish, type ScheduledRow } from "@/lib/utils/scheduled";

export const dynamic = "force-dynamic";

type Publishable = PgTable & {
  id: PgColumn;
  status: PgColumn;
  publishedAt: PgColumn;
  slug?: PgColumn;
  consentGiven?: PgColumn;
};

const ENTITIES: { name: string; table: Publishable; paths: (slug: string) => string[] }[] = [
  { name: "offices", table: offices, paths: (s) => ["/contact", "/about/offices", `/offices/${s}`] },
  { name: "team_members", table: teamMembers, paths: (s) => ["/about/team", `/team/${s}`] },
  { name: "partners", table: partners, paths: () => ["/"] },
  { name: "pages", table: pages, paths: (s) => ["/about", `/about/${s}`] },
  {
    name: "destinations",
    table: destinations,
    paths: (s) => ["/study-abroad", `/study-abroad/${s}`],
  },
  { name: "services", table: services, paths: (s) => ["/services", `/services/${s}`] },
  { name: "institutions", table: institutions, paths: (s) => ["/institutions", `/institutions/${s}`] },
  { name: "courses", table: courses, paths: (s) => ["/courses", `/courses/${s}`] },
  {
    name: "test_prep_courses",
    table: testPrepCourses,
    paths: (s) => ["/test-preparation", `/test-preparation/${s}`],
  },
  { name: "posts", table: posts, paths: (s) => ["/news", `/news/${s}`] },
  { name: "events", table: events, paths: (s) => ["/events", `/events/${s}`] },
  { name: "testimonials", table: testimonials, paths: () => ["/", "/success-stories"] },
];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || !(await sameSecret(token, secret))) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 401 });
  }

  const now = new Date();
  const published: Record<string, number> = {};
  const paths = new Set<string>();

  for (const entity of ENTITIES) {
    const table = entity.table;
    const rows = await db
      .select({
        id: table.id,
        status: table.status,
        publishedAt: table.publishedAt,
        slug: table.slug ?? sql<string | null>`null`,
        consentGiven: table.consentGiven ?? sql<boolean | null>`null`,
      })
      .from(table)
      .where(and(eq(table.status, "scheduled"), lte(table.publishedAt, now)));

    const due = rows.filter((row) =>
      isDueToPublish(
        {
          status: row.status as ScheduledRow["status"],
          publishedAt: row.publishedAt as Date | null,
          consentGiven: (row.consentGiven as boolean | null) ?? undefined,
        },
        now,
      ),
    );
    if (due.length === 0) continue;

    await db
      .update(table)
      .set({ status: "published", updatedAt: now })
      .where(inArray(table.id, due.map((row) => String(row.id))));

    for (const row of due) {
      await writeAudit({
        action: "publish",
        entityType: entity.name,
        entityId: String(row.id),
        summary: "Published on schedule.",
      });
      for (const path of entity.paths(String(row.slug ?? ""))) paths.add(path);
    }

    published[entity.name] = due.length;
  }

  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, published });
}

// Hashing first makes both sides the same length, so a wrong secret gives nothing away through
// how long the compare takes.
async function sameSecret(given: string, expected: string) {
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
