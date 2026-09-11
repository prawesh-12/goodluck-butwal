"use client";

import { useState } from "react";
import { LazyMotion, domMax, m } from "framer-motion";
import { NewsCard } from "@/components/shared/inner";
import { Chip } from "@/components/ui/bits";
import type { EventCard } from "@/features/events/queries";

const TABS = ["Upcoming", "Past"] as const;

export function EventTabs({ events, empty }: { events: EventCard[]; empty: { upcoming: string; past: string } }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  // Upcoming reads soonest first, past reads most recent first.
  const shown = tab === "Past" ? events.filter((e) => e.past).reverse() : events.filter((e) => !e.past);

  return (
    <LazyMotion features={domMax}>
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <div role="tablist" aria-label="Filter by date" className="flex flex-wrap items-center justify-center gap-[10px]">
          {TABS.map((name) => (
            <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className="relative h-[38px] overflow-clip rounded-full bg-surface px-5 text-[14px] font-medium leading-[18.2px]">
              {tab === name && <m.span layoutId="events-tab" className="absolute inset-0 bg-[#100F12]" transition={{ type: "spring", bounce: 0, duration: 0.5 }} />}
              <span className={`relative transition-colors duration-300 ${tab === name ? "text-white" : "text-muted"}`}>{name}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="t-body text-muted">
            {tab === "Upcoming" ? empty.upcoming : empty.past}
          </p>
        ) : (
          <m.div layout className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
            {shown.map((event, i) => (
              <m.div key={event.article.slug} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6, delay: Math.min(i * 0.04, 0.4) }} className="flex flex-col gap-[10px]">
                <NewsCard article={event.article} href={`/events/${event.article.slug}`} />
                <div className="flex flex-wrap items-center gap-[10px] px-1">
                  <Chip wrap>{event.when}</Chip>
                  <Chip wrap>{event.place}</Chip>
                </div>
              </m.div>
            ))}
          </m.div>
        )}
      </div>
    </LazyMotion>
  );
}
