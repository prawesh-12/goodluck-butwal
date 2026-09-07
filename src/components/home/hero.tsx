"use client";

import { useEffect, useRef, useState } from "react";
import { easeInOut, motion, useScroll, useTransform } from "motion/react";
import { gl, img } from "@/lib/assets";
import { googleRating } from "@/content/stories";
import { Appear } from "@/components/ui/appear";
import { FlatButton, PillButton } from "@/components/ui/button";

const destinationFlags = [
  { name: "Australia", flag: "/images/flags/australia.svg" },
  { name: "New Zealand", flag: "/images/flags/new-zealand.svg" },
  { name: "United Kingdom", flag: "/images/flags/united-kingdom.svg" },
];

export function Hero() {
  const { scrollY } = useScroll();
  const grass = useTransform(scrollY, [380, 460], [1, 0], { ease: easeInOut });
  // The reference hero is max(175vh, 1262px) tall and the meadow's scroll rate grows with that height
  // (fitted from 1262 to 2100px: scale 1 + 3.665e-7 * (H + 1264) per scrolled px, sinking 1398px per unit of scale).
  const section = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(1575);
  useEffect(() => {
    const measure = () => setHeight(section.current?.offsetHeight ?? 1575);
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);
  const rate = 3.665e-7 * (height + 1264);
  const grassScale = useTransform(scrollY, (v) => 1 + v * rate);
  const grassY = useTransform(scrollY, (v) => 1398 * v * rate);

  return (
    <section ref={section} className="relative flex w-full flex-col items-center overflow-clip bg-white pb-[100px] pt-[128px] md:pb-[160px] md:pt-[158px] lg:h-[175vh] lg:min-h-[1262px] lg:pb-0 lg:pt-[194px]">
      <div aria-hidden className="absolute inset-0 z-0 flex items-center justify-center overflow-clip">
        <img src={img.heroSky} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 100%" }} />
      </div>

      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[120px]">
          <div className="flex w-full flex-col items-center gap-[30px] md:gap-10">
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-wrap items-center justify-center gap-x-[10px] gap-y-0 md:gap-[30px]">
                <Appear y={20} delay={0.1}>
                  <h1 className="t-h1">Create your</h1>
                </Appear>
                <div className="flex h-10 w-[37px] items-center justify-center md:h-[60px] md:w-[74px] lg:h-[100px] lg:w-[124px]">
                  <Appear y={20} delay={0.2} rotate={-16} className="flex size-[37px] shrink-0 items-center justify-center rounded-[8px] bg-white md:size-[74px] md:rounded-[16px] lg:size-[124px] lg:rounded-[28px] [filter:drop-shadow(rgba(0,0,0,0.1)_0px_8px_6px)_drop-shadow(rgba(0,0,0,0.3)_0px_3px_3px)]">
                    <img src={gl.mark} alt="Goodluck" className="size-[80%] object-contain" />
                  </Appear>
                </div>
                <Appear y={20} delay={0.3}>
                  <h1 className="t-h1">luck</h1>
                </Appear>
              </div>
              <Appear y={20} delay={0.4} className="mt-[10px] max-w-[600px] md:mt-5">
                <p className="t-lead text-center text-muted">
                  Our qualified migration agents and education counsellors will deal with your application to study in{" "}
                  <span className="inline-flex translate-y-[3px] items-center gap-[3px] align-baseline">
                    {destinationFlags.map((d, i) => (
                      // The flag SVGs are circles, so scale them past the corners to fill the square tile.
                      <span key={d.name} className={`block size-[22px] overflow-hidden rounded-[6px] ring-1 ring-black/10 ${i % 2 ? "rotate-[6deg]" : "-rotate-[6deg]"}`}>
                        <img src={d.flag} alt={d.name} className="size-full scale-[1.45]" />
                      </span>
                    ))}
                  </span>
                </p>
              </Appear>
            </div>
            <Appear y={20} delay={0.5} className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
              <PillButton href="/contact/book-consultation">Book a consultation</PillButton>
              <FlatButton href="/services">Our services</FlatButton>
            </Appear>
            <Appear y={20} delay={0.6} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[15px] font-medium leading-[18px] text-muted">
              <span className="flex items-center gap-2">
                <img src={img.stars5} alt="" className="h-[14px] w-auto" />
                <span className="font-semibold text-ink">{googleRating.score}</span>
                <span>from {googleRating.count} Google reviews</span>
              </span>
              <span aria-hidden className="hidden size-1 rounded-full bg-ink/30 md:block" />
              <span className="flex items-center gap-[6px]">
                <img src={img.bolt} alt="" className="h-[14px] w-auto" />
                <span>
                  Since <span className="font-semibold text-ink">2022</span>
                </span>
              </span>
            </Appear>
          </div>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute z-[1] hidden md:block" style={{ top: -40, left: -130, width: 602 }}>
        <img src={img.cloud1} alt="" className="w-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute left-1/2 z-[1] hidden -translate-x-1/2 md:block" style={{ top: 50, width: 519 }}>
        <img src={img.cloud2} alt="" className="w-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute z-[1] hidden md:block" style={{ top: 80, right: -60, width: 584 }}>
        <img src={img.cloud3} alt="" className="w-full" />
      </div>

      <motion.div aria-hidden style={{ opacity: grass }} className="pointer-events-none absolute inset-0 z-[2] hidden flex-col items-center overflow-clip lg:flex">
        <Appear y={260} delay={0.5} duration={1.6} className="flex h-[98%] w-full items-end justify-center overflow-clip pb-[680px]">
          <motion.div style={{ scale: grassScale, y: grassY }} className="relative w-[112%] min-w-[1640px] max-w-none shrink-0">
            <img src={gl.heroMeadow} alt="" className="w-full max-w-none" />
            {/* Cloud band over the cutout's lower edge so it dissolves into mist instead of showing the sky behind it. */}
            <div aria-hidden className="absolute inset-x-0 -bottom-[220px] h-[62%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.85)_42%,rgba(255,255,255,0.85)_62%,rgba(255,255,255,0)_100%)]" />
          </motion.div>
        </Appear>
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute -bottom-px -left-[10px] -right-[10px] z-[2] h-[100px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_25%,#fff_50%)] md:h-[160px] lg:h-[200px]" />
    </section>
  );
}
