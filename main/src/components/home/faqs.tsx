"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { PublicMember } from "@/server/queries/people";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";

export type FaqItem = { q: string; a: string };
export type FaqCtaText = { title: string; line: string; cta: string; you: string };

// Pages that do not pass their own wording yet keep these.
const ctaText: FaqCtaText = {
  title: "Still have questions?",
  line: "Book an appointment and our team can assess your case.",
  cta: "Book an appointment",
  you: "You",
};

export function Accordion({ items, defaultOpen = 0, variant = "surface" }: { items: FaqItem[]; defaultOpen?: number | null; variant?: "surface" | "white" }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="flex w-full flex-col items-start gap-4 md:gap-5">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`flex w-full flex-col justify-center overflow-hidden rounded-[10px] ring-1 ring-inset transition-colors duration-300 md:rounded-[20px] ${variant === "white" ? `ring-black/20 ${isOpen ? "bg-white" : "bg-transparent"}` : `ring-hairline ${isOpen ? "bg-surface" : "bg-transparent"}`}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-start gap-[10px] py-3 pl-5 pr-3 text-left md:p-5">
              <span className="flex min-h-[30px] flex-1 items-center">
                <span className="text-[18px] font-medium leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]">{q}</span>
              </span>
              <motion.span animate={{ rotate: isOpen ? 90 : 0, backgroundColor: isOpen ? "#1d1d1d" : variant === "white" ? "#ffffff" : "#edf1f4" }} transition={{ duration: 0.3 }} className="relative flex size-[26px] shrink-0 items-center justify-center rounded-full md:size-[30px]">
                <motion.span animate={{ opacity: isOpen ? 0 : 1, backgroundColor: isOpen ? "#ffffff" : "#1d1d1d" }} className="absolute h-[2px] w-4 rounded-full" />
                <motion.span animate={{ backgroundColor: isOpen ? "#ffffff" : "#1d1d1d" }} className="absolute h-4 w-[2px] rounded-full" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="overflow-hidden">
                  <p className="t-base pb-5 pl-5 pr-[60px] text-muted">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// "Still have questions" card: three counsellors from the team list plus the reader.
export function FaqCta({ faces, className = "", text = ctaText }: { faces: PublicMember[]; className?: string; text?: FaqCtaText }) {
  return (
    <div className={`flex w-full flex-col items-start gap-5 overflow-clip rounded-[10px] bg-surface p-5 md:rounded-[30px] md:p-10 ${className}`}>
      <div className="flex items-center gap-[10px]">
        <div className="flex items-center pr-[10px]">
          {faces.map((m) => (
            <span key={m.slug} className="block w-[30px]">
              <img src={m.photo} alt="" className="size-10 max-w-none rounded-full object-cover object-top" loading="lazy" decoding="async" />
            </span>
          ))}
        </div>
        <p className="text-[18px] font-semibold leading-[23.4px] text-ink">+</p>
        <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(312deg,#3b82f6_0%,#406ae4_100%)] text-[14px] font-semibold leading-[18.2px] text-white">{text.you}</span>
      </div>
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-col items-start gap-1">
          <h3 className="t-h5">{text.title}</h3>
          <p className="t-base text-muted">{text.line}</p>
        </div>
        <PillButton href="/contact/book-consultation" tone="dark">
          {text.cta}
        </PillButton>
      </div>
    </div>
  );
}

export function Faqs({ faces, items, text }: { faces: PublicMember[]; items: FaqItem[]; text: { title: string; lead: string; still: FaqCtaText } }) {
  return (
    <section className="flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
      <div className="container-x">
        <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
          <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
            <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
              <h2 className="t-h2">{text.title}</h2>
              <p className="t-body text-muted">{text.lead}</p>
            </div>
            <FaqCta faces={faces} text={text.still} className="order-3 md:order-none" />
          </Appear>
          <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
            <Accordion items={items} />
          </Appear>
        </div>
      </div>
    </section>
  );
}
