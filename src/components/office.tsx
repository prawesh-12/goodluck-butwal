"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { primaryOffices, type OfficeId } from "@/lib/site";

// One brand, two offices: the choice is remembered per browser and reorders office-specific content.
const KEY = "goodluck-office";
const Ctx = createContext<{ office: OfficeId; setOffice: (o: OfficeId) => void }>({ office: "au", setOffice: () => {} });

export function OfficeProvider({ children }: { children: ReactNode }) {
  const [office, set] = useState<OfficeId>("au");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "au" || saved === "np") set(saved);
    } catch {}
  }, []);
  const setOffice = (o: OfficeId) => {
    set(o);
    try {
      localStorage.setItem(KEY, o);
    } catch {}
  };
  return <Ctx.Provider value={{ office, setOffice }}>{children}</Ctx.Provider>;
}

export const useOffice = () => useContext(Ctx);

export function OfficeSwitcher({ size = "sm", className = "" }: { size?: "sm" | "lg"; className?: string }) {
  const { office, setOffice } = useOffice();
  return (
    <div role="radiogroup" aria-label="Choose office" className={`flex items-center rounded-full bg-surface p-1 ${size === "lg" ? "h-[46px]" : "h-[34px] lg:h-[38px]"} ${className}`}>
      {primaryOffices.map((o) => {
        const active = o.id === office;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={active} onClick={() => setOffice(o.id)} className={`relative h-full rounded-full font-medium transition-colors ${size === "lg" ? "px-5 text-[16px]" : "px-3 text-[14px]"} ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
            {active && <motion.span layoutId={`office-pill-${size}`} className="absolute inset-0 rounded-full bg-white shadow-[0_0_0_1px_rgba(221,229,237,0.9)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />}
            <span className="relative">{o.country}</span>
          </button>
        );
      })}
    </div>
  );
}
