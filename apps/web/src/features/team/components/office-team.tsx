"use client";

import type { PublicMember } from "@/features/team/queries";
import { TeamCard } from "@/components/shared/inner";
import { useOffice } from "@/features/offices/components/office";

// The home page shows the visitor's own office. An office with nobody published falls back to
// everyone rather than an empty block.
export function OfficeTeam({ team }: { team: PublicMember[] }) {
  const { office } = useOffice();
  const local = team.filter((m) => m.office === office);
  const shown = local.length ? local : team;
  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[30px] md:gap-y-10 lg:grid-cols-4">
      {shown.map((m, i) => (
        <TeamCard key={m.slug} name={m.name} role={m.role} photo={m.photo} delay={Math.min(i * 0.04, 0.4)} href={`/team/${m.slug}`} />
      ))}
    </div>
  );
}
