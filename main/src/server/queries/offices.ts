import { asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { offices } from "@db/schema";
import { formatOpeningHours } from "@/lib/datetime";

// The shape the public components render. Client components take this as a prop, they cannot
// query themselves.
export type PublicOffice = {
  id: string;
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

export async function listOffices(): Promise<PublicOffice[]> {
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
    id: row.code,
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
}
