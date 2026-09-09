import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { offices, testimonials } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/auth/rbac";
import { asStatus, PAGE_SIZE, type EditorialFilters } from "@/lib/utils/admin-query";
import { testimonialTypes } from "@/features/testimonials/validators";

function testimonialWhere(actor: Actor, f: EditorialFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(testimonials, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(
      or(
        ilike(testimonials.displayName, like),
        ilike(testimonials.authorName, like),
        ilike(testimonials.quote, like),
      ),
    );
  }
  const status = asStatus(f.status);
  if (status) parts.push(eq(testimonials.status, status));
  if (testimonialTypes.includes(f.type as "text")) {
    parts.push(eq(testimonials.type, f.type as "text"));
  }
  if (f.office) parts.push(eq(testimonials.officeId, f.office));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminTestimonials(actor: Actor, f: EditorialFilters) {
  const where = testimonialWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: testimonials.id,
        type: testimonials.type,
        displayName: testimonials.displayName,
        authorName: testimonials.authorName,
        isAnonymised: testimonials.isAnonymised,
        status: testimonials.status,
        consentGiven: testimonials.consentGiven,
        isFeatured: testimonials.isFeatured,
        office: offices.name,
      })
      .from(testimonials)
      .leftJoin(offices, eq(testimonials.officeId, offices.id))
      .where(where)
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(testimonials).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminTestimonial(id: string) {
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  return row;
}
