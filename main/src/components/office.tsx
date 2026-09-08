"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { primaryOffices, type OfficeId } from "@/lib/site";

// One brand, two offices: the visitor's timezone decides which one the site leads with.
const Ctx = createContext<{ office: OfficeId }>({ office: "au" });

const noop = () => () => {};
// Browsers report "Asia/Kathmandu" or the older "Asia/Katmandu". The server snapshot is "au" so hydration matches.
const fromTimezone = (): OfficeId => (/Asia\/Kat(h)?mandu/.test(Intl.DateTimeFormat().resolvedOptions().timeZone) ? "np" : "au");

export function OfficeProvider({ children }: { children: ReactNode }) {
  const office = useSyncExternalStore(noop, fromTimezone, (): OfficeId => "au");
  return <Ctx.Provider value={{ office }}>{children}</Ctx.Provider>;
}

export const useOffice = () => useContext(Ctx);

// The office is picked from the visitor's timezone, so the nav only shows which one they're seeing.
export function OfficeBadge({ className = "" }: { className?: string }) {
  const { office } = useOffice();
  const o = primaryOffices.find((x) => x.id === office)!;
  return (
    <span className={`inline-flex h-[34px] items-center gap-2 rounded-full bg-surface pl-[6px] pr-[14px] text-[14px] font-medium text-ink lg:h-[38px] ${className}`}>
      <img src={o.flag} alt="" className="size-[22px] rounded-full ring-2 ring-white" loading="lazy" decoding="async" />
      {o.country}
    </span>
  );
}
