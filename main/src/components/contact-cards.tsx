"use client";

import type { PublicOffice } from "@/server/queries/offices";
import { useOffice } from "@/components/office";

// Office contact cards, the chosen office first.
export function OfficeContactCards({ offices, whatsappLabel }: { offices: PublicOffice[]; whatsappLabel: string }) {
  const { office } = useOffice();
  const ordered = [...offices].sort((a, b) => Number(b.id === office) - Number(a.id === office));
  return (
    <div className="grid w-full gap-[10px]">
      {ordered.map((o, i) => (
        <div key={o.id} className={`flex flex-col gap-1 rounded-[10px] p-4 ring-1 ring-inset md:rounded-[20px] md:p-5 ${i === 0 ? "bg-ink text-white ring-ink" : "bg-white ring-hairline"}`}>
          <p className={`t-small ${i === 0 ? "text-gray-text" : "text-muted"}`}>{o.label}</p>
          <p className="text-[18px] font-semibold leading-[23.4px]">{o.city}, {o.country}</p>
          <p className={`t-base ${i === 0 ? "text-gray-text" : "text-muted"}`}>{o.address}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href={o.tel} className={`t-base font-semibold underline underline-offset-4 ${i === 0 ? "text-white" : "text-ink"}`}>{o.phone}</a>
            {o.whatsapp && (
              <a href={o.whatsapp} target="_blank" rel="noopener" className={`t-base font-semibold underline underline-offset-4 ${i === 0 ? "text-white" : "text-ink"}`}>{whatsappLabel}</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
