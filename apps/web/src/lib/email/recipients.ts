import { eq } from "drizzle-orm";
import { db } from "@goodluck/db";
import { settings } from "@goodluck/db/schema";
import { company } from "@/config/site";

// One address per office in admin Settings. Anything that is not Nepal goes to Australia.
export async function staffAddress(officeCode?: string | null) {
  const key = officeCode === "np" ? "notify_email_np" : "notify_email_au";
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
  return String(row?.value ?? "") || company.email;
}
