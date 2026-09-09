import { and, asc, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { consultations, destinations, enquiries, offices, services } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/rbac";

export const PAGE_SIZE = 25;

export type LeadFilters = {
  q?: string;
  status?: string;
  destination?: string;
  service?: string;
  from?: string;
  to?: string;
  page?: number;
};

function enquiryWhere(actor: Actor, f: LeadFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(enquiries, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(
      or(
        ilike(enquiries.fullName, like),
        ilike(enquiries.email, like),
        ilike(enquiries.phone, like),
        ilike(enquiries.referenceCode, like),
      ),
    );
  }
  if (f.status) parts.push(eq(enquiries.status, f.status as "new"));
  if (f.service) parts.push(eq(services.slug, f.service));
  if (f.from) parts.push(gte(enquiries.createdAt, new Date(f.from)));
  if (f.to) parts.push(lte(enquiries.createdAt, new Date(`${f.to}T23:59:59Z`)));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

const enquiryColumns = {
  id: enquiries.id,
  reference: enquiries.referenceCode,
  fullName: enquiries.fullName,
  email: enquiries.email,
  phone: enquiries.phone,
  location: enquiries.currentLocation,
  message: enquiries.message,
  status: enquiries.status,
  createdAt: enquiries.createdAt,
  sourcePage: enquiries.sourcePage,
  referrer: enquiries.referrer,
  utmSource: enquiries.utmSource,
  utmMedium: enquiries.utmMedium,
  utmCampaign: enquiries.utmCampaign,
  internalNotes: enquiries.internalNotes,
  office: offices.name,
  destination: destinations.name,
  service: services.name,
};

export async function listEnquiries(actor: Actor, f: LeadFilters) {
  const where = enquiryWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select(enquiryColumns)
      .from(enquiries)
      .leftJoin(offices, eq(enquiries.officeId, offices.id))
      .leftJoin(destinations, eq(enquiries.destinationId, destinations.id))
      .leftJoin(services, eq(enquiries.serviceId, services.id))
      .where(where)
      .orderBy(desc(enquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    // Joined here too because the service filter matches on the slug, which lives on services.
    db
      .select({ n: count() })
      .from(enquiries)
      .leftJoin(services, eq(enquiries.serviceId, services.id))
      .where(where),
  ]);

  return { rows, total: total.n, page };
}

// Export runs the same filter as the list, so nobody can widen their reach through the download.
export async function exportEnquiries(actor: Actor, f: LeadFilters) {
  return db
    .select(enquiryColumns)
    .from(enquiries)
    .leftJoin(offices, eq(enquiries.officeId, offices.id))
    .leftJoin(destinations, eq(enquiries.destinationId, destinations.id))
    .leftJoin(services, eq(enquiries.serviceId, services.id))
    .where(enquiryWhere(actor, f))
    .orderBy(desc(enquiries.createdAt));
}

export async function getEnquiry(actor: Actor, id: string) {
  const [row] = await db
    .select({ ...enquiryColumns, officeId: enquiries.officeId })
    .from(enquiries)
    .leftJoin(offices, eq(enquiries.officeId, offices.id))
    .leftJoin(destinations, eq(enquiries.destinationId, destinations.id))
    .leftJoin(services, eq(enquiries.serviceId, services.id))
    .where(eq(enquiries.id, id));
  return row;
}

export async function listServiceOptions() {
  return db
    .select({ slug: services.slug, name: services.name })
    .from(services)
    .orderBy(asc(services.sortOrder));
}

function consultationWhere(actor: Actor, f: LeadFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(consultations, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(
      or(
        ilike(consultations.fullName, like),
        ilike(consultations.email, like),
        ilike(consultations.phone, like),
        ilike(consultations.referenceCode, like),
      ),
    );
  }
  if (f.status) parts.push(eq(consultations.status, f.status as "pending"));
  if (f.from) parts.push(gte(consultations.preferredDate, f.from));
  if (f.to) parts.push(lte(consultations.preferredDate, f.to));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

const consultationColumns = {
  id: consultations.id,
  reference: consultations.referenceCode,
  fullName: consultations.fullName,
  email: consultations.email,
  phone: consultations.phone,
  preferredDate: consultations.preferredDate,
  preferredTime: consultations.preferredTime,
  contactMethod: consultations.preferredContactMethod,
  notes: consultations.notes,
  status: consultations.status,
  confirmedAt: consultations.confirmedAt,
  createdAt: consultations.createdAt,
  internalNotes: consultations.internalNotes,
  office: offices.name,
  officeTimezone: offices.timezone,
  service: services.name,
};

export async function listConsultations(actor: Actor, f: LeadFilters) {
  const where = consultationWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select(consultationColumns)
      .from(consultations)
      .leftJoin(offices, eq(consultations.officeId, offices.id))
      .leftJoin(services, eq(consultations.serviceId, services.id))
      .where(where)
      .orderBy(asc(consultations.preferredDate), asc(consultations.preferredTime))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(consultations).where(where),
  ]);

  // Two pending requests at the same moment cannot both be kept, so the list flags them.
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "pending") continue;
    const slot = `${row.preferredDate} ${row.preferredTime}`;
    seen.set(slot, (seen.get(slot) ?? 0) + 1);
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      clashes: row.status === "pending" && (seen.get(`${row.preferredDate} ${row.preferredTime}`) ?? 0) > 1,
    })),
    total: total.n,
    page,
  };
}

export async function exportConsultations(actor: Actor, f: LeadFilters) {
  return db
    .select(consultationColumns)
    .from(consultations)
    .leftJoin(offices, eq(consultations.officeId, offices.id))
    .leftJoin(services, eq(consultations.serviceId, services.id))
    .where(consultationWhere(actor, f))
    .orderBy(asc(consultations.preferredDate));
}
