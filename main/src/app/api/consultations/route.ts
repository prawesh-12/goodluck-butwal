import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { consultations, offices, services } from "@db/schema";
import { consultationSchema } from "@/features/leads/validators";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clientIp, hashIp, referenceCode } from "@/lib/utils/request";
import { overRateLimit } from "@/lib/security/rate-limit";
import { sendEmailQuietly } from "@/lib/email";
import { consultationToStaff, consultationToVisitor } from "@/lib/email/templates";
import { staffAddress } from "@/lib/email/recipients";
import { formatInOfficeTz, officeSlot } from "@/lib/utils/datetime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = consultationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const ip = clientIp(request);
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "That did not look human. Try again." }, { status: 400 });
  }

  const ipHash = await hashIp(ip);
  const [office] = await db
    .select({ id: offices.id, code: offices.code, name: offices.name, timezone: offices.timezone, addressLine1: offices.addressLine1, phoneDisplay: offices.phoneDisplay })
    .from(offices)
    .where(eq(offices.code, data.officeCode));

  if (!office) {
    return NextResponse.json({ ok: false, error: "Choose one of our offices." }, { status: 400 });
  }

  const reference = referenceCode("CON");

  if (data.company_website) {
    await db.insert(consultations).values({
      referenceCode: reference,
      fullName: data.fullName,
      email: data.email,
      officeId: office.id,
      status: "cancelled",
      ipHash,
      sourcePage: data.sourcePage,
    });
    return NextResponse.json({ ok: true, reference });
  }

  if (await overRateLimit(consultations, ipHash)) {
    return NextResponse.json(
      { ok: false, error: "That is a few requests in a short time. Try again in an hour, or call us." },
      { status: 429 },
    );
  }

  const [service] = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.slug, data.serviceSlug));

  await db.insert(consultations).values({
    referenceCode: reference,
    officeId: office.id,
    serviceId: service?.id ?? null,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    preferredContactMethod: data.preferredContactMethod,
    notes: data.notes || null,
    sourcePage: data.sourcePage,
    ipHash,
  });

  // Shown in the office's own zone, which is the only reading of the time that means anything.
  const slot = officeSlot(data.preferredDate, data.preferredTime);
  const when = slot ? formatInOfficeTz(slot, office.timezone) : `${data.preferredDate} ${data.preferredTime}`;

  const payload = {
    reference,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    service: service?.name,
    when,
    notes: data.notes,
    contactMethod: data.preferredContactMethod,
  };

  const staff = await staffAddress(office.code);

  await Promise.all([
    sendEmailQuietly({ ...consultationToStaff(payload, office), to: staff, replyTo: data.email }),
    sendEmailQuietly({ ...consultationToVisitor(payload, office), to: data.email }),
  ]);

  return NextResponse.json({ ok: true, reference });
}
