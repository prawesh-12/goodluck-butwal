import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@db/client";
import { destinationFaqs, destinations } from "@db/schema";
import { combine, pageOf, PAGE_SIZE, type ContentFilters } from "@/lib/utils/admin-query";

export async function listAdminDestinations(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(destinations.name, `%${f.q}%`), ilike(destinations.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(destinations.status, f.status as "draft") : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: destinations.id,
        slug: destinations.slug,
        name: destinations.name,
        status: destinations.status,
        hasPage: destinations.hasPage,
        isFeatured: destinations.isFeatured,
        updatedAt: destinations.updatedAt,
      })
      .from(destinations)
      .where(where)
      .orderBy(asc(destinations.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(destinations).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminDestination(id: string) {
  const [row] = await db.select().from(destinations).where(eq(destinations.id, id));
  return row;
}

export async function listDestinationFaqs(destinationId: string) {
  return db
    .select({
      id: destinationFaqs.id,
      question: destinationFaqs.question,
      answerHtml: destinationFaqs.answerHtml,
    })
    .from(destinationFaqs)
    .where(eq(destinationFaqs.destinationId, destinationId))
    .orderBy(asc(destinationFaqs.sortOrder));
}
