import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@goodluck/db";
import { offices, services } from "@goodluck/db/schema";
import { formatOpeningHours, type OpeningHours } from "@/lib/utils/datetime";
import type { OfficeId } from "@/config/site";
import { TAGS, cached } from "@/lib/cache";

export type PublicOffice = {
  id: OfficeId;
  country: string;
  city: string;
  label: string;
  address: string;
  phone: string;
  tel: string;
  whatsapp?: string;
  timezone: string;
  flag: string;
  hours?: string;
};

// wa.me takes digits only, so the + and any spacing in the stored number have to go.
export const whatsappLink = (number: string | null) => {
  const digits = (number ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
};

const officeRows = cached(async (): Promise<PublicOffice[]> => {
  const rows = await db
    .select({
      code: offices.code,
      country: offices.country,
      city: offices.city,
      label: offices.name,
      address: offices.addressLine1,
      phoneDisplay: offices.phoneDisplay,
      phone: offices.phone,
      whatsapp: offices.whatsapp,
      timezone: offices.timezone,
      openingHours: offices.openingHours,
    })
    .from(offices)
    .where(eq(offices.status, "published"))
    .orderBy(asc(offices.sortOrder));

  return rows.map((row) => ({
    id: row.code as OfficeId,
    country: row.country,
    city: row.city ?? "",
    label: row.label,
    address: row.address ?? "",
    phone: row.phoneDisplay ?? "",
    tel: `tel:${row.phone ?? ""}`,
    whatsapp: whatsappLink(row.whatsapp),
    timezone: row.timezone,
    flag: `/images/flags/${row.country.toLowerCase().replace(/\s+/g, "-")}.svg`,
    hours: formatOpeningHours(row.openingHours) ?? undefined,
  }));
}, ["offices"], [TAGS.offices]);

export const listOffices = cache(officeRows);

export type OfficeProfile = PublicOffice & {
  slug: string;
  email: string;
  mapsUrl: string | null;
  mapsEmbedUrl: string | null;
  openingHours: OpeningHours | null;
  profileHtml: string | null;
  credentialsHtml: string | null;
};

// Cebu is a contact address only, so /offices/cebu must 404 rather than half-render.
const OFFICES_WITH_A_PAGE = ["au", "np"];

export const listOfficeProfiles = cache(async (): Promise<OfficeProfile[]> => {
  const rows = await db
    .select({
      slug: offices.slug,
      code: offices.code,
      country: offices.country,
      city: offices.city,
      label: offices.name,
      addressLine1: offices.addressLine1,
      addressLine2: offices.addressLine2,
      phoneDisplay: offices.phoneDisplay,
      phone: offices.phone,
      whatsapp: offices.whatsapp,
      email: offices.email,
      timezone: offices.timezone,
      mapsUrl: offices.mapsUrl,
      mapsEmbedUrl: offices.mapsEmbedUrl,
      openingHours: offices.openingHours,
      profileHtml: offices.profileHtml,
      credentialsHtml: offices.credentialsHtml,
    })
    .from(offices)
    .where(and(eq(offices.status, "published"), inArray(offices.code, OFFICES_WITH_A_PAGE)))
    .orderBy(asc(offices.sortOrder));

  return rows.map((row) => ({
    slug: row.slug,
    id: row.code as OfficeId,
    country: row.country,
    city: row.city ?? "",
    label: row.label,
    address: [row.addressLine1, row.addressLine2].filter(Boolean).join(", "),
    phone: row.phoneDisplay ?? "",
    tel: `tel:${row.phone ?? ""}`,
    whatsapp: whatsappLink(row.whatsapp),
    email: row.email ?? "",
    timezone: row.timezone,
    flag: `/images/flags/${row.country.toLowerCase().replace(/\s+/g, "-")}.svg`,
    hours: formatOpeningHours(row.openingHours) ?? undefined,
    mapsUrl: row.mapsUrl,
    mapsEmbedUrl: row.mapsEmbedUrl,
    openingHours: row.openingHours ?? null,
    profileHtml: row.profileHtml,
    credentialsHtml: row.credentialsHtml,
  }));
});

export const getOfficeProfile = async (slug: string) =>
  (await listOfficeProfiles()).find((office) => office.slug === slug);

// Name and link only, not the artwork and steps listServices() carries.
export const listServiceLinks = cache(async () =>
  db
    .select({ slug: services.slug, name: services.name, summary: services.summary })
    .from(services)
    .where(eq(services.status, "published"))
    .orderBy(asc(services.sortOrder)),
);

// The office select on the team, users, posts and events editors. Not cached: an admin form
// should see a new office the moment it exists.
export async function officeOptions() {
  return db.select({ id: offices.id, name: offices.name }).from(offices).orderBy(asc(offices.name));
}
