import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs, event as eventSchema } from "@/lib/seo/schema";
import { notFound } from "next/navigation";
import { getEvent, listEvents, seatsTaken } from "@/features/events/queries";
import { eventTypeLabels } from "@/config/content-meta";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { registrationRefusal } from "@/features/events/validators";
import { Appear } from "@/components/ui/appear";
import { Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, SectionHead } from "@/components/shared/inner";
import { RegistrationForm } from "@/features/events/components/registration-form";
import { formText } from "@/features/site-text/form-text";
import { loadText } from "@/features/site-text/queries";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export const generateStaticParams = async () => (await listEvents()).map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return buildMetadata({ path: "/events", title: "Events", noindex: true });
  return buildEntityMetadata("event", slug, {
    path: `/events/${slug}`,
    title: event.title,
    description: event.summary,
    image: event.image,
  });
}

export default async function EventPage({ params }: Props) {
  const t = await loadText();
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const [taken, forms] = await Promise.all([seatsTaken(event.id), formText()]);
  const closed = registrationRefusal({
    registrationEnabled: event.registrationEnabled,
    registrationDeadline: event.registrationDeadline,
    startsAt: event.startsAt,
    capacity: event.capacity,
    seatsTaken: taken,
    attendees: 1,
  });
  const seatsLeft = event.capacity === null ? null : Math.max(0, event.capacity - taken);

  const starts = formatInOfficeTz(event.startsAt, event.timezone);
  const ends = event.endsAt ? formatInOfficeTz(event.endsAt, event.timezone) : null;

  return (
    <>
      <JsonLd
        data={[
          eventSchema(event),
          breadcrumbs([{ name: "Home", path: "/" }, { name: "Events", path: "/events" }, { name: event.title, path: `/events/${event.slug}` }]),
        ]}
      />
      <InnerHero
        bg="field"
        clouds={false}
        pb="pb-[50px]"
        size="md"
        title={event.title}
        lead={event.summary}
        className="[&_h1]:order-2 [&_p]:order-3"
      >
        <div className="order-1 flex flex-wrap items-center justify-center gap-[10px]">
          <Chip>{eventTypeLabels[event.eventType]}</Chip>
          <Chip wrap>{starts}</Chip>
          {event.officeName ? <Chip>{event.officeName}</Chip> : null}
        </div>
      </InnerHero>

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[50px]">
            {event.image ? (
              <Appear y={10} duration={0.6} className="aspect-[1533/458] w-full overflow-clip rounded-[10px] md:rounded-[20px]">
                <img src={event.image} alt={event.title} className="size-full object-cover" loading="lazy" decoding="async" />
              </Appear>
            ) : null}

            {event.html ? (
              <div className="article article-scroll w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: event.html }} />
            ) : null}

            <div className="grid w-full max-w-[800px] gap-5 md:grid-cols-2 md:gap-[30px]">
              <InfoCard
                label="When"
                title={starts}
                line={ends ? `Until ${ends}` : `In the time zone of the ${event.officeName} office`}
              />
              {event.isOnline ? (
                <InfoCard
                  label="Where"
                  title={t("events.online.title", "This event runs online")}
                  line="The joining link is on your confirmation email once you register."
                  tone="blue"
                />
              ) : (
                <InfoCard label="Where" title={event.venueName ?? event.officeName} line={event.venueAddress ?? undefined} />
              )}
            </div>

            {!event.isOnline && event.mapsEmbedUrl?.startsWith("https://") ? (
              <Appear className="w-full max-w-[800px] overflow-clip rounded-[10px] md:rounded-[20px]">
                <iframe
                  title={`Map to ${event.venueName ?? event.title}`}
                  src={event.mapsEmbedUrl}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Appear>
            ) : null}

            <div className="flex w-full max-w-[800px] flex-col gap-[30px]">
              <SectionHead align="left" title={t("events.register.title", "Register")} lead={closed ? undefined : "Tell us you are coming and we will email you the details."} />
              <RegistrationForm eventId={event.id} closed={closed} seatsLeft={seatsLeft} text={forms} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
