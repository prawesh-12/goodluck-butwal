import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@db/client";
import { courses, events, institutions, testPrepCourses } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { previewMetadata } from "@/lib/security/preview";
import { InnerHero } from "@/components/shared/inner";
import { Chip } from "@/components/ui/bits";
import type { Entity } from "@/lib/auth/rbac";
import { loadText } from "@/features/site-text/queries";

export const metadata = previewMetadata;
export const dynamic = "force-dynamic";

// Posts keep their own route because they render the full article template.
const KINDS: Record<
  string,
  { entity: Entity; table: PgTable; slug: PgColumn; title: PgColumn; body: PgColumn | null; status: PgColumn }
> = {
  institution: { entity: "institutions", table: institutions, slug: institutions.slug, title: institutions.name, body: institutions.descriptionHtml, status: institutions.status },
  course: { entity: "courses", table: courses, slug: courses.slug, title: courses.name, body: courses.descriptionHtml, status: courses.status },
  event: { entity: "events", table: events, slug: events.slug, title: events.title, body: events.descriptionHtml, status: events.status },
  "test-prep": { entity: "testPrep", table: testPrepCourses, slug: testPrepCourses.slug, title: testPrepCourses.name, body: testPrepCourses.descriptionHtml, status: testPrepCourses.status },
};

export default async function Preview({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;
  const t = await loadText();
  const target = KINDS[kind];
  if (!target) notFound();

  const actor = await requireActor();
  allow(actor, target.entity, "read");

  const [row] = await db
    .select({ title: target.title, status: target.status, body: target.body ?? target.title })
    .from(target.table)
    .where(eq(target.slug, decodeURIComponent(slug)));

  if (!row) notFound();

  return (
    <>
      <InnerHero
        title={String(row.title)}
        lead={t("preview.lead", "This is a preview. Only signed-in staff can see it, and search engines are told to ignore it.")}
      >
        <Chip>{String(row.status)}</Chip>
      </InnerHero>
      <section className="pb-section flex w-full flex-col items-center">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          {row.body ? (
            <div className="article" dangerouslySetInnerHTML={{ __html: String(row.body) }} />
          ) : (
            <p className="t-body text-muted">
              {t("preview.no_body", "This record has no body text yet. Everything else about it is on its admin screen.")}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
