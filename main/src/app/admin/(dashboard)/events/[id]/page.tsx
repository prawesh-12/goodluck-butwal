import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { utcToZonedInput, type EventInput } from "@/lib/validators/event";
import { EventForm } from "@/components/admin/event-form";
import { pickedMedia } from "@/server/queries/admin-people";
import { getAdminEvent, officeZones } from "@/server/queries/admin-events";
import { seatsTaken } from "@/server/queries/events";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "events", "update");

  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) notFound();
  allowOwn(actor, event);

  const [offices, media, taken] = await Promise.all([
    officeZones(),
    pickedMedia([event.coverImageId, event.seoOgImageId]),
    seatsTaken(event.id),
  ]);

  // The stored instants go back into the inputs as the office's own wall clock.
  const zone = offices.find((office) => office.id === event.officeId)?.timezone ?? "UTC";
  const local = (value: Date | null) => (value ? utcToZonedInput(value, zone) : "");

  return (
    <>
      <h1 className="t-h4">{event.title}</h1>
      <p className="t-small admin-help">
        <a href={`/events/${event.slug}`} target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <EventForm
        values={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          eventType: event.eventType as EventInput["eventType"],
          officeId: event.officeId ?? "",
          summary: event.summary ?? "",
          descriptionHtml: event.descriptionHtml ?? "",
          coverImageId: event.coverImageId ?? "",
          startsAt: local(event.startsAt),
          endsAt: local(event.endsAt),
          isOnline: event.isOnline,
          onlineUrl: event.onlineUrl ?? "",
          venueName: event.venueName ?? "",
          venueAddress: event.venueAddress ?? "",
          mapsEmbedUrl: event.mapsEmbedUrl ?? "",
          capacity: event.capacity,
          registrationEnabled: event.registrationEnabled,
          registrationDeadline: local(event.registrationDeadline),
          status: event.status,
          publishedAt: event.publishedAt ? event.publishedAt.toISOString().slice(0, 16) : "",
          seoTitle: event.seoTitle ?? "",
          seoDescription: event.seoDescription ?? "",
          seoOgImageId: event.seoOgImageId ?? "",
          seoNoindex: event.seoNoindex,
          canonicalUrl: event.canonicalUrl ?? "",
        }}
        offices={offices}
        cover={media.get(event.coverImageId ?? "") ?? null}
        shareImage={media.get(event.seoOgImageId ?? "") ?? null}
        seatsTaken={taken}
        canPublish={can(actor, "events", "publish")}
        canDelete={can(actor, "events", "delete")}
      />
    </>
  );
}
