import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { offices, services } from "@db/schema";
import { formatOpeningHours, type OpeningHours } from "@/lib/datetime";
import type { OfficeId } from "@/lib/site";

// The shape the public components render. Client components take this as a prop, they cannot
// query themselves.
export type PublicOffice = {
  id: OfficeId;
  country: string;
  city: string;
  label: string;
  address: string;
  phone: string;
  tel: string;
  timezone: string;
  flag: string;
  hours?: string;
};

export const listOffices = cache(async (): Promise<PublicOffice[]> => {
  const rows = await db
    .select({
      code: offices.code,
      country: offices.country,
      city: offices.city,
      label: offices.name,
      address: offices.addressLine1,
      phoneDisplay: offices.phoneDisplay,
      phone: offices.phone,
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
    timezone: row.timezone,
    flag: `/images/flags/${row.country.toLowerCase().replace(/\s+/g, "-")}.svg`,
    hours: formatOpeningHours(row.openingHours) ?? undefined,
  }));
});

export type OfficeProfile = PublicOffice & {
  slug: string;
  email: string;
  mapsUrl: string | null;
  mapsEmbedUrl: string | null;
  openingHours: OpeningHours | null;
  profileHtml: string | null;
  credentialsHtml: string | null;
};

// Melbourne and Butwal are the two offices with a page of their own. Cebu is a contact address,
// so /offices/cebu has to 404 rather than render a half-empty page.
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

// The office pages list what the office does. They need a name and a link, not the artwork,
// steps and facts that listServices() carries for the service pages themselves.
export const listServiceLinks = cache(async () =>
  db
    .select({ slug: services.slug, name: services.name, summary: services.summary })
    .from(services)
    .where(eq(services.status, "published"))
    .orderBy(asc(services.sortOrder)),
);
