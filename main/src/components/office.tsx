"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { OfficeId } from "@/lib/site";
import type { PublicOffice } from "@/server/queries/offices";
import { readOfficeCookie, resolveOffice } from "@/lib/office-cookie";

// One brand, three offices. A cookie left by an earlier visit still wins, otherwise the visitor's
// timezone decides which one the site leads with. Nothing writes that cookie any more, the header
// selector that used to was taken out.
const Ctx = createContext<{ office: OfficeId; offices: PublicOffice[] }>({ office: "au", offices: [] });

// The office is settled on the first client render and never changes after it, so the store has
// nothing to publish.
const subscribe = () => () => {};

export function OfficeProvider({ children, offices }: { children: ReactNode; offices: PublicOffice[] }) {
  const codes = offices.map((o) => o.id);
  // The server snapshot is "au" so the first client render matches the HTML; React swaps in the
  // real answer straight after hydration, which is why the cookie is never read on the server.
  const office = useSyncExternalStore(
    subscribe,
    () => resolveOffice(readOfficeCookie(document.cookie), Intl.DateTimeFormat().resolvedOptions().timeZone, codes),
    (): OfficeId => "au",
  );
  return <Ctx.Provider value={{ office, offices }}>{children}</Ctx.Provider>;
}

export const useOffice = () => useContext(Ctx);
