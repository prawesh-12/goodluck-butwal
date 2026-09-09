import { NextResponse } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@db/client";
import { testPrepBatches, testPrepRegistrations } from "@db/schema";
import { registerSchema } from "@/features/test-prep/validators";
import { BATCH_FULL, registrationRefusal } from "@/features/test-prep/seats";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clientIp, hashIp } from "@/lib/utils/request";
import { overRateLimit } from "@/lib/security/rate-limit";
import { batchForRegistration } from "@/features/test-prep/queries";
import { MODE_LABEL } from "@/features/test-prep/schedule";
import { sendEmailQuietly } from "@/lib/email";
import { testPrepToRegistrant, testPrepToStaff } from "@/lib/email/templates";
import { staffAddress } from "@/lib/email/recipients";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
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

  // A bot filled the hidden field. Record it, tell it everything went fine, take no seat.
  if (data.company_website) {
    await db.insert(testPrepRegistrations).values({
      batchId: data.batchId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      notes: "[SPAM] hidden field was filled in",
      status: "cancelled",
      sourcePage: data.sourcePage,
      ipHash,
    });
    return NextResponse.json({ ok: true });
  }

  if (await overRateLimit(testPrepRegistrations, ipHash)) {
    return NextResponse.json(
      { ok: false, error: "That is a few registrations in a short time. Try again in an hour, or call us." },
      { status: 429 },
    );
  }

  const batch = await batchForRegistration(data.batchId);
  if (!batch || batch.courseStatus !== "published") {
    return NextResponse.json({ ok: false, error: "That batch is not taking registrations." }, { status: 404 });
  }

  const refusal = registrationRefusal(batch);
  if (refusal) return NextResponse.json({ ok: false, error: refusal }, { status: 409 });

  // Two people can hit the last seat at once, so the seat is claimed by the update itself and
  // the row is only written if that update took one.
  const [claimed] = await db
    .update(testPrepBatches)
    .set({ seatsTaken: sql`${testPrepBatches.seatsTaken} + 1`, updatedAt: new Date() })
    .where(and(eq(testPrepBatches.id, batch.id), lt(testPrepBatches.seatsTaken, testPrepBatches.totalSeats)))
    .returning({ id: testPrepBatches.id, seatsTaken: testPrepBatches.seatsTaken });

  if (!claimed) return NextResponse.json({ ok: false, error: BATCH_FULL }, { status: 409 });

  await db.insert(testPrepRegistrations).values({
    batchId: batch.id,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    notes: data.notes || null,
    sourcePage: data.sourcePage,
    ipHash,
  });

  // The seat is taken and the row is written. Mail is sent after that and never fails the
  // request, the same as every other form on the site.
  const details = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    course: batch.courseName,
    batch: batch.batchName,
    starts: batch.startDate,
    mode: MODE_LABEL[batch.mode] ?? batch.mode,
    notes: data.notes,
  };
  const office = {
    name: batch.officeName ?? "",
    addressLine1: batch.officeAddress,
    phoneDisplay: batch.officePhone,
  };

  await Promise.all([
    sendEmailQuietly({ ...testPrepToRegistrant(details, office), to: data.email }),
    sendEmailQuietly({
      ...testPrepToStaff(details, office),
      to: await staffAddress(batch.officeCode),
      replyTo: data.email,
    }),
  ]);

  return NextResponse.json({ ok: true, batch: batch.batchName });
}
