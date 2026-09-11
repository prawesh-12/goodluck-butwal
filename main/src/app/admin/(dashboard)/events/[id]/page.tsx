import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { utcToZonedInput, type EventInput } from "@/features/events/validators";
import { EventForm } from "@/features/events/components/event-form";
import { pickedMedia } from "@/features/media/admin-queries";
import { getAdminEvent, officeZones } from "@/features/events/admin-queries";
import { seatsTaken } from "@/features/events/queries";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { FlatBadge, StatusBadge } from "@/components/shared/admin/list-ui";
import { eventTypeLabels } from "@/config/content-meta";
import { Button } from "@/components/ui/admin/button";

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
    pickedMedia([event.coverImageId]),
    seatsTaken(event.id),
  ]);

  // The stored instants go back into the inputs as the office's own wall clock.
  const zone = offices.find((office) => office.id === event.officeId)?.timezone ?? "UTC";
  const local = (value: Date | null) => (value ? utcToZonedInput(value, zone) : "");

  return (
    <div className="space-y-6">
      <EditorHeader
        backHref="/admin/events"
        backLabel="Events"
        title={event.title}
        meta={
          <>
            <StatusBadge status={event.status} />
            <FlatBadge variant="outline">{eventTypeLabels[event.eventType]}</FlatBadge>
          </>
        }
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${event.id}/registrations`}>
              <Users />
              View registrations
            </Link>
          </Button>
        }
      />

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
        }}
        offices={offices}
        cover={media[event.coverImageId ?? ""] ?? null}
        seatsTaken={taken}
        canPublish={can(actor, "events", "publish")}
        canDelete={can(actor, "events", "delete")}
      />
    </div>
  );
}
