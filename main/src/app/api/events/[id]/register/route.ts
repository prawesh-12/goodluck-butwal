import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@db/client";
import { eventRegistrations, events, offices } from "@db/schema";
import {
  EVENT_FULL,
  eventRegistrationSchema,
  insertOutcome,
  registrationRefusal,
} from "@/features/events/validators";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clientIp, hashIp } from "@/lib/utils/request";
import { overRateLimit } from "@/lib/security/rate-limit";
import { sendEmailQuietly } from "@/lib/email";
import { eventRegistered } from "@/lib/email/templates";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { seatsTaken } from "@/features/events/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = eventRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      isOnline: events.isOnline,
      onlineUrl: events.onlineUrl,
      venueName: events.venueName,
      venueAddress: events.venueAddress,
      capacity: events.capacity,
      registrationEnabled: events.registrationEnabled,
      registrationDeadline: events.registrationDeadline,
      timezone: offices.timezone,
      officeName: offices.name,
      officeAddress: offices.addressLine1,
      officePhone: offices.phoneDisplay,
    })
    .from(events)
    .leftJoin(offices, eq(events.officeId, offices.id))
    .where(eq(events.id, id));

  if (!event || event.status !== "published") {
    return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });
  }

  const ip = clientIp(request);
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "That did not look human. Try again." }, { status: 400 });
  }

  // A bot filled the hidden field. Tell it everything went fine and write nothing.
  if (data.company_website) return NextResponse.json({ ok: true });

  const ipHash = await hashIp(ip);
  if (await overRateLimit(eventRegistrations, ipHash)) {
    return NextResponse.json(
      { ok: false, error: "That is a few registrations in a short time. Try again in an hour, or call us." },
      { status: 429 },
    );
  }

  // Two seats could still be sold twice under a burst. Overbooking by one is a phone call;
  // a duplicate email is not, which is why that one is settled by the unique index below.
  const refusal = registrationRefusal({
    registrationEnabled: event.registrationEnabled,
    registrationDeadline: event.registrationDeadline,
    startsAt: event.startsAt,
    capacity: event.capacity,
    seatsTaken: await seatsTaken(event.id),
    attendees: data.attendees,
  });
  if (refusal) return NextResponse.json({ ok: false, error: refusal }, { status: 409 });

  const inserted = await db
    .insert(eventRegistrations)
    .values({
      eventId: event.id,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      attendees: data.attendees,
      notes: data.notes || null,
      sourcePage: data.sourcePage,
      ipHash,
    })
    // The unique index is on (event_id, lower(email)), an expression, so no target is named:
    // any conflict on this table is that one.
    .onConflictDoNothing()
    .returning({ id: eventRegistrations.id });

  const outcome = insertOutcome(inserted);
  if (!outcome.ok) return NextResponse.json(outcome, { status: 409 });

  // The capacity check above is a read, so a burst could slip past it. Re-count inside the same
  // request and give the seat back if this registration is the one that tipped it over. The
  // unique index already settles duplicates, this settles the last seat.
  if (event.capacity !== null) {
    const [after] = await db
      .select({ taken: sql<number>`coalesce(sum(${eventRegistrations.attendees}), 0)::int` })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          ne(eventRegistrations.status, "cancelled"),
        ),
      );

    if (after.taken > event.capacity) {
      await db.delete(eventRegistrations).where(eq(eventRegistrations.id, inserted[0].id));
      return NextResponse.json({ ok: false, error: EVENT_FULL }, { status: 409 });
    }
  }

  const zone = event.timezone ?? "UTC";
  const where = event.isOnline
    ? (event.onlineUrl ?? "Online")
    : [event.venueName, event.venueAddress].filter(Boolean).join(", ");

  await sendEmailQuietly({
    ...eventRegistered(
      {
        fullName: data.fullName,
        event: event.title,
        when: formatInOfficeTz(event.startsAt, zone),
        where,
      },
      {
        name: event.officeName ?? "",
        addressLine1: event.officeAddress,
        phoneDisplay: event.officePhone,
      },
    ),
    to: data.email,
  });

  return NextResponse.json({ ok: true });
}
