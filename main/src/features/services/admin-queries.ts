import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@db/client";
import { serviceFaqs, services } from "@db/schema";
import { combine, pageOf, PAGE_SIZE, type ContentFilters } from "@/lib/utils/admin-query";

export async function listAdminServices(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(services.name, `%${f.q}%`), ilike(services.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(services.status, f.status as "draft") : undefined,
    f.scope ? eq(services.officeScope, f.scope as "both") : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        category: services.category,
        officeScope: services.officeScope,
        tone: services.tone,
        status: services.status,
        updatedAt: services.updatedAt,
      })
      .from(services)
      .where(where)
      .orderBy(asc(services.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(services).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminService(id: string) {
  const [row] = await db.select().from(services).where(eq(services.id, id));
  return row;
}

export async function listServiceFaqs(serviceId: string) {
  return db
    .select({ id: serviceFaqs.id, question: serviceFaqs.question, answerHtml: serviceFaqs.answerHtml })
    .from(serviceFaqs)
    .where(eq(serviceFaqs.serviceId, serviceId))
    .orderBy(asc(serviceFaqs.sortOrder));
}
