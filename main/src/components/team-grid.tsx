"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { team } from "@/content/team";
import { offices, type OfficeId } from "@/lib/site";
import { TeamCard } from "@/components/inner";
import { useOffice } from "@/components/office";

type Tab = "all" | OfficeId;
const tabs: { id: Tab; label: string }[] = [{ id: "all", label: "Whole team" }, ...offices.map((o) => ({ id: o.id, label: o.country }))];

// Team by office, as the brief asks, with the whole team one tap away. Starts on the office chosen in the header.
export function TeamGrid() {
  const { office } = useOffice();
  const [tab, setTab] = useState<Tab>("all");
  useEffect(() => setTab(office), [office]);
  const shown = tab === "all" ? team : team.filter((m) => m.office === tab);
  const officeName = (id: OfficeId | null) => (id ? `${offices.find((o) => o.id === id)!.city}, ${offices.find((o) => o.id === id)!.country}` : undefined);
  return (
    <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
      <div role="tablist" aria-label="Filter by office" className="flex flex-wrap items-center justify-center gap-[10px]">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className="relative h-[38px] overflow-clip rounded-full bg-surface px-5 text-[14px] font-medium leading-[18.2px]">
            {tab === t.id && <motion.span layoutId="team-tab" className="absolute inset-0 bg-[#100F12]" transition={{ type: "spring", bounce: 0, duration: 0.5 }} />}
            <span className={`relative transition-colors duration-300 ${tab === t.id ? "text-white" : "text-muted"}`}>{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[30px] md:gap-y-10 lg:grid-cols-4">
        {shown.map((m, i) => (
          <motion.div key={m.slug} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6, delay: Math.min(i * 0.04, 0.4) }}>
            <TeamCard name={m.name} role={m.role} photo={m.photo} office={tab === "all" ? officeName(m.office) : undefined} />
          </motion.div>
        ))}
      </motion.div>
      <p className="t-small text-center text-muted">{shown.length} of {team.length} team members</p>
    </div>
  );
}
