import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { destinations, enquiries, offices, services, settings } from "@db/schema";
import { enquirySchema } from "@/lib/validators/lead";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp, hashIp, referenceCode } from "@/lib/request";
import { overRateLimit } from "@/lib/rate-limit";
import { sendEmailQuietly } from "@/lib/email";
import { enquiryToStaff, enquiryToVisitor } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = enquirySchema.safeParse(await request.json().catch(() => null));
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
  const office = data.officeCode
    ? (await db.select({ id: offices.id, email: offices.email, code: offices.code }).from(offices).where(eq(offices.code, data.officeCode)))[0]
    : undefined;

  const reference = referenceCode("ENQ");

  // A bot filled the hidden field. Record it, tell it everything went fine, send nothing.
  if (data.company_website) {
    await db.insert(enquiries).values({
      referenceCode: reference,
      fullName: data.fullName,
      email: data.email,
      message: data.message,
      status: "spam",
      officeId: office?.id ?? null,
      ipHash,
      sourcePage: data.sourcePage,
    });
    return NextResponse.json({ ok: true, reference });
  }

  if (await overRateLimit(enquiries, ipHash)) {
    return NextResponse.json(
      { ok: false, error: "That is a few enquiries in a short time. Try again in an hour, or call us." },
      { status: 429 },
    );
  }

  const destination = data.destinationSlug
    ? (await db.select({ id: destinations.id, name: destinations.name }).from(destinations).where(eq(destinations.slug, data.destinationSlug)))[0]
    : undefined;
  const service = data.subject
    ? (await db.select({ id: services.id, name: services.name }).from(services).where(eq(services.slug, data.subject)))[0]
    : undefined;

  await db.insert(enquiries).values({
    referenceCode: reference,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    currentLocation: data.currentLocation || null,
    destinationId: destination?.id ?? null,
    serviceId: service?.id ?? null,
    officeId: office?.id ?? null,
    message: data.message,
    sourcePage: data.sourcePage,
    referrer: data.referrer,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    ipHash,
  });

  const payload = {
    reference,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    location: data.currentLocation,
    destination: destination?.name,
    subject: service?.name ?? data.subject,
    message: data.message,
    sourcePage: data.sourcePage,
    utm: { source: data.utmSource, medium: data.utmMedium, campaign: data.utmCampaign },
  };

  const notify = await staffAddress(office?.code);
  await Promise.all([
    sendEmailQuietly({ ...enquiryToStaff(payload), to: notify, replyTo: data.email }),
    sendEmailQuietly({ ...enquiryToVisitor(payload), to: data.email }),
  ]);

  return NextResponse.json({ ok: true, reference });
}

async function staffAddress(officeCode?: string) {
  const key = officeCode === "np" ? "notify_email_np" : "notify_email_au";
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
  return String(row?.value ?? "info@goodluck.services");
}
