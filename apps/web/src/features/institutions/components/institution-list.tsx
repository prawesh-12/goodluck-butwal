"use client";

import { useState } from "react";
import { LazyMotion, domMax, m } from "framer-motion";
import { InstitutionCard } from "@/features/institutions/components/institution-card";
import type { PublicInstitution } from "@/features/institutions/queries";

export function InstitutionList({ institutions }: { institutions: PublicInstitution[] }) {
  const destinations = ["All", ...Array.from(new Set(institutions.map((i) => i.destination).filter(Boolean)))];
  const [tab, setTab] = useState("All");
  const shown = tab === "All" ? institutions : institutions.filter((i) => i.destination === tab);
  return (
    <LazyMotion features={domMax}>
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        {destinations.length > 2 && (
          <div role="tablist" aria-label="Filter by destination" className="flex flex-wrap items-center justify-center gap-[10px]">
            {destinations.map((d) => (
              <button key={d} type="button" role="tab" aria-selected={tab === d} onClick={() => setTab(d)} className="relative h-[38px] overflow-clip rounded-full bg-surface px-5 text-[14px] font-medium leading-[18.2px]">
                {tab === d && <m.span layoutId="institution-tab" className="absolute inset-0 bg-[#100F12]" transition={{ type: "spring", bounce: 0, duration: 0.5 }} />}
                <span className={`relative transition-colors duration-300 ${tab === d ? "text-white" : "text-muted"}`}>{d}</span>
              </button>
            ))}
          </div>
        )}
        <m.div layout className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
          {shown.map((institution, i) => (
            <m.div key={institution.slug} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6, delay: Math.min(i * 0.04, 0.4) }}>
              <InstitutionCard institution={institution} />
            </m.div>
          ))}
        </m.div>
      </div>
    </LazyMotion>
  );
}
