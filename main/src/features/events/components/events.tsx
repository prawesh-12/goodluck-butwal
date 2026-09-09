"use client";

import { NewsCard } from "@/components/shared/inner";
import { useOffice } from "@/features/offices/components/office";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, Chip } from "@/components/ui/bits";
import type { UpcomingEvent } from "@/features/events/queries";

export type EventsText = { badge: string; title: string; cta: string };

export function Events({ events, text }: { events: UpcomingEvent[]; text: EventsText }) {
  const { office } = useOffice();
  const mine = events.filter((event) => event.officeCode === office).slice(0, 3);
  if (mine.length === 0) return null;

  return (
    <section id="events" className="pb-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
          <div className="flex w-full flex-col gap-[10px] md:flex-row md:items-end md:gap-[30px] lg:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">{text.badge}</Badge>
              <h2 className="t-h2">{text.title}</h2>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start md:items-end">
              <PillButton href="/events" tone="dark">
                {text.cta}
              </PillButton>
            </Appear>
          </div>
          <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
            {mine.map((event, i) => (
              <div key={event.slug} className={`flex flex-col gap-[10px] ${i === 2 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                <NewsCard
                  article={{
                    slug: event.slug,
                    title: event.title,
                    date: event.date,
                    category: event.kind,
                    image: event.image,
                    excerpt: "",
                  }}
                  href={`/events/${event.slug}`}
                  delay={0.05 * i}
                />
                <div className="flex flex-wrap items-center gap-[10px] px-1">
                  <Chip wrap>{event.when}</Chip>
                  <Chip wrap>{event.place}</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
