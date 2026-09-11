"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { OfficeId } from "@/config/site";
import type { PublicOffice } from "@/features/offices/queries";
import { officeCookie, readOfficeCookie, resolveOffice } from "@/features/offices/cookie";

// A saved choice wins, otherwise the visitor's timezone decides.
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
  // The server snapshot is "au" so the first client render matches the HTML. This is why the
  // cookie is never read on the server, which would make every public page dynamic.
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
