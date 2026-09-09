"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { consultations, enquiries, offices, services } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/security/audit";
import { sendEmailQuietly } from "@/lib/email";
import { consultationConfirmed } from "@/lib/email/templates";
import { formatInOfficeTz } from "@/lib/utils/datetime";

type Result = { ok: true } | { ok: false; error: string };

const enquiryUpdate = z.object({
  id: z.uuid(),
  status: z.enum(["new", "in_progress", "contacted", "converted", "closed", "spam"]),
  internalNotes: z.string().optional(),
});

export async function updateEnquiry(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "enquiries", "update");

  const parsed = enquiryUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields below." };
  const data = parsed.data;

  const [existing] = await db
    .select({ officeId: enquiries.officeId, reference: enquiries.referenceCode })
    .from(enquiries)
    .where(eq(enquiries.id, data.id));
  if (!existing) return { ok: false, error: "That enquiry no longer exists." };

  // Checked on the loaded row, never on the id that came from the form.
  requireOwnership(actor, existing);

  await db
    .update(enquiries)
    .set({ status: data.status, internalNotes: data.internalNotes ?? null, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(enquiries.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "enquiries",
    entityId: data.id,
    summary: `${existing.reference} is now ${data.status}`,
  });

  revalidatePath("/admin/enquiries");
  return { ok: true };
}

export async function confirmConsultation(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "consultations", "update");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That request could not be found." };

  const [row] = await db
    .select({
      id: consultations.id,
      officeId: consultations.officeId,
      reference: consultations.referenceCode,
      fullName: consultations.fullName,
      email: consultations.email,
      phone: consultations.phone,
      date: consultations.preferredDate,
      time: consultations.preferredTime,
      service: services.name,
      officeName: offices.name,
      timezone: offices.timezone,
      address: offices.addressLine1,
      officePhone: offices.phoneDisplay,
    })
    .from(consultations)
    .leftJoin(offices, eq(consultations.officeId, offices.id))
    .leftJoin(services, eq(consultations.serviceId, services.id))
    .where(eq(consultations.id, parsed.data.id));

  if (!row) return { ok: false, error: "That request no longer exists." };
  requireOwnership(actor, row);

  await db
    .update(consultations)
    .set({ status: "confirmed", confirmedAt: new Date(), updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(consultations.id, row.id));

  // The visitor reads the time in the office's zone, with the zone named.
  const when = formatInOfficeTz(`${row.date}T${row.time}:00Z`, row.timezone ?? "Australia/Melbourne");

  await sendEmailQuietly({
    ...consultationConfirmed(
      { reference: row.reference, fullName: row.fullName, email: row.email, phone: row.phone, service: row.service, when },
      { name: row.officeName ?? "", addressLine1: row.address, phoneDisplay: row.officePhone },
    ),
    to: row.email,
  });

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "consultations",
    entityId: row.id,
    summary: `${row.reference} confirmed for ${when}`,
  });

  revalidatePath("/admin/consultations");
  return { ok: true };
}
