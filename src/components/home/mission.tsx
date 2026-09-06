"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { gl, img } from "@/lib/assets";
import { about } from "@/content/about";
import { googleRating } from "@/content/stories";
import { offices } from "@/lib/site";
import { Appear } from "@/components/ui/appear";

const mission = {
  title: "Our mission",
  text: about.mission,
  items: about.ethics,
  stats: [["2022", "Established"], [String(offices.length), "Offices worldwide"]],
  photo: gl.founders,
  photoAlt: "Co-founders Bimal Gurung and Kishor Gharti Magar",
  caption: `${about.founders}, Co-founders`,
};
const vision = {
  title: "Our vision",
  text: about.vision,
  items: about.whyChoose.slice(0, 4),
  stats: [[googleRating.score, "Google rating"], [String(googleRating.count), "Client reviews"]],
  photo: "/images/about/team-hands.jpg",
  photoAlt: "A team stacking hands together",
  caption: "Goodluck Education & Migration, since 2022",
};

// The before/after panel from the reference, used here as the mission/vision switch. It flips when the sticky container docks under the nav.
export function Mission() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const { scrollY } = useScroll();
  const top = useRef(0);
  useEffect(() => {
    const measure = () => { if (ref.current) top.current = ref.current.getBoundingClientRect().top + window.scrollY; };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);
  useMotionValueEvent(scrollY, "change", (v) => setOn(v >= top.current - 80));

  const data = on ? vision : mission;
  const tab = (label: string, active: boolean, side: "l" | "r") => (
    <div className={`flex h-[70px] w-[69px] items-end md:h-[90px] md:w-[215px] ${side === "l" ? "justify-end rounded-br-[20px] border-b border-r pb-5 pr-5" : "justify-start rounded-bl-[20px] border-b border-l pb-5 pl-5"} border-hairline`}>
      <motion.p animate={{ opacity: active ? 1 : 0.3 }} transition={{ duration: 0.4 }} className="whitespace-nowrap text-[14px] font-medium leading-[18.2px] text-ink md:text-[16px] md:leading-[20.8px]">
        {label}
      </motion.p>
    </div>
  );

  return (
    <section id="about" className="pt-section relative flex w-full flex-col items-center gap-[100px]">
      <div ref={ref} className="sticky top-20 z-[1] w-full px-4 md:max-w-[760px] md:px-5 lg:px-[30px]">
        <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
          <Appear y={10} delay={0.1} duration={0.6} className="md:px-[30px]">
            <h2 className="t-h2 text-center">Goodluck strives to give excellent service</h2>
          </Appear>

          <div className="relative flex w-full flex-col items-center pt-[69px] md:pt-[89px]">
            <div className="absolute inset-x-[50px] top-0 z-[1] flex h-[70px] items-center justify-center gap-5 md:h-[90px]">
              <div aria-hidden className="absolute inset-x-[64px] top-0 z-0 h-[35px] bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0)_100%)] md:inset-x-[150px] md:h-[45px]" />
              <div aria-hidden className="absolute inset-x-[50px] top-[69px] z-0 h-px bg-white md:top-[89px]" />
              {tab("Mission", !on, "l")}
              <div className="relative z-[1] h-[70px] w-20 md:h-[90px] md:w-[130px]">
                <div className="absolute left-1/2 top-0 h-[98px] w-20 -translate-x-1/2 md:h-40 md:w-[130px] [filter:drop-shadow(rgba(0,0,0,0.2)_0px_2px_2px)_drop-shadow(rgba(0,0,0,0.3)_0px_7px_9px)]">
                  <motion.img src={img.knobBefore} alt="" animate={{ opacity: on ? 0 : 1, rotate: on ? 25 : 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6 }} className="absolute inset-0 size-full object-contain" />
                  <motion.img src={img.knobAfter} alt="" animate={{ opacity: on ? 1 : 0, rotate: on ? 0 : -25 }} transition={{ type: "spring", bounce: 0, duration: 0.6 }} className="absolute inset-0 size-full object-contain" />
                </div>
              </div>
              {tab("Vision", on, "r")}
            </div>

            <div className="relative w-full overflow-clip rounded-[10px] p-[6px] ring-1 ring-inset ring-hairline md:rounded-[30px]">
              <div className={`relative overflow-clip rounded-[6px] px-5 pb-5 pt-10 transition-colors duration-500 md:rounded-[24px] md:px-[30px] md:pb-[30px] md:pt-[90px] lg:pb-[55px] ${on ? "bg-black" : "bg-surface"}`}>
                <AnimatePresence>
                  {on && (
                    <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} aria-hidden className="absolute -inset-[6px] z-0 overflow-clip">
                      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#000_0%,#000_60%,rgba(0,0,0,0.2)_100%)]" />
                      <img src={img.sunset} alt="" className="absolute inset-0 size-full object-cover" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={on ? "vision" : "mission"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="relative z-[1] grid gap-5 md:grid-cols-[1fr_0.85fr] md:items-stretch md:gap-[30px]">
                    <div className="flex flex-col items-start gap-[14px] md:gap-5">
                      <span className={`inline-flex h-7 items-center rounded-full px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] ${on ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "bg-white text-muted"}`}>{on ? "Vision" : "Mission"}</span>
                      <h3 className={`t-h3 ${on ? "!text-white" : ""}`}>{data.title}</h3>
                      <p className={`t-body ${on ? "text-gray-text" : "text-muted"}`}>{data.text}</p>
                      <div className="flex flex-col items-start gap-[10px] pt-1">
                        {data.items.map((t) => (
                          <div key={t} className="flex items-center gap-3">
                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${on ? "bg-[rgba(16,185,129,0.18)] ring-[rgba(16,185,129,0.4)]" : "btn-blue ring-[#5290f4]"}`}>
                              <img src={on ? img.checkGreen : img.check} alt="" className={on ? "" : "brightness-0 invert"} style={{ width: 12, height: 9 }} />
                            </span>
                            <p className={`text-[16px] font-semibold leading-[20.8px] md:text-[18px] md:leading-[23.4px] ${on ? "text-white" : "text-ink"}`}>{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[320px] overflow-clip rounded-[10px] md:min-h-0 md:rounded-[20px]">
                      <img src={data.photo} alt={data.photoAlt} className="absolute inset-0 size-full object-cover object-top" />
                      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_35%,rgba(0,0,0,0.6)_100%)]" />
                      <div className="absolute inset-x-[10px] bottom-[10px] flex flex-col gap-[10px]">
                        <div className="grid grid-cols-2 gap-[10px]">
                          {data.stats.map(([v, l], i) => (
                            <Appear key={v} y={10} delay={0.3 + i * 0.1} duration={0.6} className="flex flex-col gap-[2px] rounded-[8px] bg-white/20 p-3 ring-1 ring-inset ring-white/30 backdrop-blur-[16px] md:rounded-[14px] md:p-4">
                              <h4 className="t-h4 !text-white">{v}</h4>
                              <p className="t-small text-white/80">{l}</p>
                            </Appear>
                          ))}
                        </div>
                        <p className="t-small px-1 text-white/80">{data.caption}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="h-[450px] w-full" />
    </section>
  );
}
