import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { settings } from "@db/schema";
import { company } from "@/config/site";

// Which inbox a submission lands in is set in admin Settings, one address per office. Anything
// that is not the Nepal office goes to the Australia address, which is where the head office is.
export async function staffAddress(officeCode?: string | null) {
  const key = officeCode === "np" ? "notify_email_np" : "notify_email_au";
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
  return String(row?.value ?? "") || company.email;
}
