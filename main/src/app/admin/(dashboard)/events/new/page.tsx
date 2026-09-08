import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { EventForm, type EventValues } from "@/components/admin/event-form";
import { officeZones } from "@/server/queries/admin-events";

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
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  seoOgImageId: "",
  seoNoindex: false,
  canonicalUrl: "",
};

export default async function NewEventPage() {
  const actor = await requireActor();
  allow(actor, "events", "create");

  const offices = await officeZones();

  return (
    <>
      <h1 className="t-h4">Add an event</h1>
      <EventForm
        values={empty}
        offices={offices}
        cover={null}
        shareImage={null}
        seatsTaken={0}
        canPublish={can(actor, "events", "publish")}
        canDelete={false}
      />
    </>
  );
}
