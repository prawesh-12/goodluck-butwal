import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listEventCards } from "@/server/queries/events";
import { InnerHero } from "@/components/inner";
import { EventTabs } from "@/components/events/event-tabs";
import { loadText } from "@/server/queries/text";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const upcoming = (await listEventCards()).filter((card) => !card.past).length;
  return buildMetadata({
    path: "/events",
    title: "Events",
    description: `${upcoming} seminars, fairs and information sessions coming up.`,
  });
}

export default async function EventsPage() {
  const [cards, t] = await Promise.all([listEventCards(), loadText()]);
  const upcoming = cards.filter((card) => !card.past).length;

  return (
    <>
      <InnerHero
        badge={t("events.hero.badge", "Events")}
        badgeTone="chip"
        title={t("events.hero.title", "Seminars, fairs and information sessions")}
        lead={`${upcoming} coming up. Times are shown in the time zone of the office running the event.`}
        clouds={false}
      />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <EventTabs
            events={cards}
            empty={{
              upcoming: t("empty.events.upcoming", "Nothing is coming up just now. Check back soon."),
              past: t("empty.events.past", "No past events yet."),
            }}
          />
        </div>
      </section>
    </>
  );
}
