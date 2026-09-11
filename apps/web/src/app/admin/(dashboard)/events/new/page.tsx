import { requireActor } from "@/lib/auth/session";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EventForm, type EventValues } from "@/features/events/components/event-form";
import { officeZones } from "@/features/events/admin-queries";

export const dynamic = "force-dynamic";

const empty: EventValues = {
  title: "",
  slug: "",
  eventType: "seminar",
  officeId: "",
  summary: "",
  descriptionHtml: "",
  coverImageId: "",
  startsAt: "",
  endsAt: "",
  isOnline: false,
  onlineUrl: "",
  venueName: "",
  venueAddress: "",
  mapsEmbedUrl: "",
  capacity: null,
  registrationEnabled: true,
  registrationDeadline: "",
  status: "draft",
};

export default async function NewEventPage() {
  const actor = await requireActor();
  allow(actor, "events", "create");

  const offices = await officeZones();

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/events" backLabel="Events" title="New event" />

      <EventForm
        values={empty}
        offices={offices}
        cover={null}
        seatsTaken={0}
        canPublish={can(actor, "events", "publish")}
        canDelete={false}
      />
    </div>
  );
}
