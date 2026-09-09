"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { OfficeId } from "@/lib/site";
import type { PublicOffice } from "@/server/queries/offices";
import { officeCookie, readOfficeCookie, resolveOffice } from "@/lib/office-cookie";

// One brand, three offices: a saved choice wins, otherwise the visitor's timezone decides which
// one the site leads with.
const Ctx = createContext<{ office: OfficeId; offices: PublicOffice[]; choose: (office: OfficeId) => void }>({
  office: "au",
  offices: [],
  choose: () => {},
});

let chosen: OfficeId | null = null;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

function choose(office: OfficeId) {
  document.cookie = officeCookie(office);
  chosen = office;
  for (const fn of listeners) fn();
}

export function OfficeProvider({ children, offices }: { children: ReactNode; offices: PublicOffice[] }) {
  const codes = offices.map((o) => o.id);
  // The server snapshot is "au" so the first client render matches the HTML; React swaps in the
  // real answer straight after hydration, which is why the cookie is never read on the server.
  const office = useSyncExternalStore(
    subscribe,
    () =>
      chosen ??
      resolveOffice(readOfficeCookie(document.cookie), Intl.DateTimeFormat().resolvedOptions().timeZone, codes),
    (): OfficeId => "au",
  );
  return <Ctx.Provider value={{ office, offices, choose }}>{children}</Ctx.Provider>;
}

export const useOffice = () => useContext(Ctx);

// The flag and country of the office in use, shown on the header selector.
export function OfficeBadge({ className = "" }: { className?: string }) {
  const { office, offices } = useOffice();
  const o = offices.find((x) => x.id === office);
  if (!o) return null;
  return (
    <span className={`inline-flex h-[34px] items-center gap-2 rounded-full bg-surface pl-[6px] pr-[14px] text-[14px] font-medium text-ink lg:h-[38px] ${className}`}>
      <img src={o.flag} alt="" className="size-[22px] rounded-full ring-2 ring-white" loading="lazy" decoding="async" />
      {o.country}
    </span>
  );
}
