"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gl } from "@/lib/assets";
import { helpWeProvide } from "@/content/destinations";
import { Appear } from "@/components/ui/appear";
import { Badge } from "@/components/ui/bits";

// The five kinds of help goodluck_main lists on every destination page, one photo each.
const steps = helpWeProvide.map((title, i) => ({ title, image: gl.steps[i] }));

// The tab strip sits on the panel like a browser tab: white line hides the panel border, shoulders curve up, a gradient fades the sides.
export function TabShoulders({ width }: { width: number }) {
  return (
    <>
      <div aria-hidden className="absolute -inset-x-[39px] bottom-0 z-[1] h-px bg-white" />
      <div aria-hidden className="absolute -left-[39px] top-0 z-[2] h-full w-10 rounded-br-[20px] border-b border-r border-hairline" />
      <div aria-hidden className="absolute -right-[39px] top-0 z-[2] h-full w-10 rounded-bl-[20px] border-b border-l border-hairline" />
      <div aria-hidden className="absolute -inset-x-[2px] -bottom-3 top-0 z-[2] bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0)_100%)]" style={{ width: width + 4 }} />
    </>
  );
}

export function Steps() {
  const [i, setI] = useState(0);
  return (
    <section id="how-we-help" className="pb-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="grid gap-[30px] md:grid-cols-2 md:items-stretch lg:gap-[70px]">
          <Appear className="flex w-full flex-col items-start gap-[30px] md:gap-10">
            <div className="flex flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">How we help</Badge>
              <h2 className="t-h2">Some of the help we provide</h2>
              <p className="t-body text-muted">From the first document check to language coaching, one team looks after your application.</p>
            </div>

            <div role="tablist" aria-label="Steps" className="flex w-full flex-col gap-2">
              {steps.map((s, n) => {
                const active = i === n;
                return (
                  <button key={s.title} type="button" role="tab" aria-selected={active} onClick={() => setI(n)} onMouseEnter={() => setI(n)} className="relative flex w-full items-center gap-4 overflow-clip rounded-[14px] px-4 py-3 text-left md:rounded-[16px] md:px-5">
                    {active && <motion.span layoutId="step-row" className="absolute inset-0 bg-ink" transition={{ type: "spring", bounce: 0, duration: 0.45 }} />}
                    <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[14px] font-semibold transition-colors duration-300 ${active ? "bg-white text-ink" : "bg-surface text-muted"}`}>0{n + 1}</span>
                    <span className={`relative text-[16px] font-semibold leading-[20.8px] transition-colors duration-300 md:text-[18px] md:leading-[23.4px] ${active ? "text-white" : "text-ink"}`}>{s.title}</span>
                    <span aria-hidden className={`relative ml-auto text-[18px] transition-all duration-300 ${active ? "translate-x-0 text-white opacity-100" : "-translate-x-2 opacity-0"}`}>→</span>
                  </button>
                );
              })}
            </div>

            <div className="grid w-full grid-cols-2 gap-5 lg:gap-[30px]">
              {[["100+", "Colleges, institutions, universities and TAFE facilities we represent"], ["5+", "Languages spoken by our certified counsellors"]].map(([v, l]) => (
                <div key={v} className="flex flex-col items-start gap-[6px]">
                  <h3 className="t-h3">{v}</h3>
                  <p className="t-base text-muted">{l}</p>
                </div>
              ))}
            </div>
          </Appear>

          <Appear delay={0.1} className="flex w-full">
            <div className="flex w-full overflow-clip rounded-[10px] p-[6px] ring-1 ring-inset ring-hairline md:rounded-[30px]">
              <div className="relative flex w-full min-h-[360px] flex-col justify-end overflow-clip rounded-[6px] bg-surface md:min-h-[520px] md:rounded-[24px]">
                <AnimatePresence initial={false}>
                  <motion.img key={i} src={steps[i].image} alt="" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.7 }} className="absolute inset-0 size-full object-cover" />
                </AnimatePresence>
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_100%)]" />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="relative flex flex-col items-start gap-[6px] p-5 md:p-[30px]">
                    <span className="inline-flex h-7 items-center rounded-full bg-white/20 px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] text-white ring-1 ring-inset ring-white/30 backdrop-blur-[10px]">Step 0{i + 1}</span>
                    <h3 className="t-h4 !text-white">{steps[i].title}</h3>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Appear>
        </div>
      </div>
    </section>
  );
}
