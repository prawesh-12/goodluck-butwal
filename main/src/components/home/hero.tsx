"use client";

import { useEffect, useRef, useState } from "react";
import { easeInOut, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { gl, img } from "@/lib/assets";
import type { GoogleRating } from "@/server/queries/editorial";
import { Appear } from "@/components/ui/appear";
import { FlatButton, PillButton } from "@/components/ui/button";
import { VideoDialog } from "@/components/ui/video-dialog";

const destinationFlags = [
  { name: "Australia", flag: "/images/flags/australia.svg" },
  { name: "New Zealand", flag: "/images/flags/new-zealand.svg" },
  { name: "United Kingdom", flag: "/images/flags/united-kingdom.svg" },
];

export type HeroText = { titleBefore: string; titleAfter: string; bookCta: string; servicesCta: string; videoTitle: string };

export function Hero({
  googleRating,
  text,
  sky = img.heroSky,
  filmSrc,
}: {
  googleRating: GoogleRating;
  text: HeroText;
  sky?: string;
  filmSrc?: string;
}) {
  const { scrollY } = useScroll();
  const grass = useTransform(scrollY, [380, 460], [1, 0], { ease: easeInOut });
  // The reference hero is max(175vh, 1262px) tall and the meadow's scroll rate grows with that height
  // (fitted from 1262 to 2100px: scale 1 + 3.665e-7 * (H + 1264) per scrolled px, sinking 1398px per unit of scale).
  const section = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(1575);
  // The film card scrolls up the page with everything else while it grows. Only once it lands centred does
  // it hold, which is why nothing resists the scroll on the way in or out. Measured off an untransformed wrapper.
  const film = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [grow, setGrow] = useState({ rest: 1, tuck: 0, pin: 0 });
  useEffect(() => {
    const measure = () => {
      setHeight(section.current?.offsetHeight ?? 1575);
      const el = film.current;
      if (!el || innerWidth < 1200) return setGrow({ rest: 1, tuck: 0, pin: 0 });
      // offsetTop, not a bounding rect: the entrance animation still has a transform on an ancestor.
      let top = 0;
      for (let node: HTMLElement | null = el; node && node !== section.current; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Laid out at full size and scaled DOWN at rest, so the video is never upscaled and stays sharp.
      const rest = Math.min(440, w) / w;
      // Where the skyline turns solid, from the same geometry the layout uses: the meadow is max(1640, 112vw)
      // wide at a 698/2172 aspect, hangs 680px above 98% of the section, and fills in by 77% of its height.
      const meadow = Math.max(1640, innerWidth * 1.12) * 0.32136;
      const roof = 0.98 * (section.current?.offsetHeight ?? 0) - 680 - meadow + meadow * 0.77;
      // Follow the roofline, but never push the card past the fold on a very wide screen where the
      // buildings themselves sit below it.
      const bottom = Math.min(roof + 40, innerHeight - 40);
      // Offset from the card's layout centre to where the small card rests. Held flat, never ramped away:
      // ramping it back to zero made the card crawl up at half the scroll speed with its bottom edge nailed
      // down, which reads as being stretched open rather than moving.
      const tuck = bottom - (h * rest) / 2 - top - h / 2;
      // The scroll at which the page carries the resting card's centre to the middle of the screen.
      setGrow({ rest, tuck, pin: Math.max(1, top + h / 2 + tuck - innerHeight / 2) });
    };
    measure();
    addEventListener("resize", measure);
    addEventListener("load", measure);
    return () => {
      removeEventListener("resize", measure);
      removeEventListener("load", measure);
    };
  }, []);
  const rate = 3.665e-7 * (height + 1264);
  const grassScale = useTransform(scrollY, (v) => 1 + v * rate);
  const grassY = useTransform(scrollY, (v) => 1398 * v * rate);
  // The meadow hangs 680px above 98% of the section height, so on a short screen 175vh would lift it over the copy.
  // The min-height keeps its skyline 568px from the top, low enough that only the film card's bottom third sits
  // behind it: (680 + 568 + meadow height) / 0.98, the meadow being max(1640px, 112vw) wide at a 698/2172 aspect.
  // Growth settles soon after the card parks, so its bottom edge stops descending early. The hold ends well
  // before the hero's bottom fade rises to meet it, otherwise the card washes out into the white.
  const GROWTH = 300;
  const HOLD = 600;
  // Transform only, and linear against scroll: the user is driving this, so easing it makes the card feel
  // like it is dragging behind the input. The radius is a fixed class, since repainting a layer that holds
  // a video every frame is what flickers.
  const filmTransform = useTransform(() => {
    if (reduce || grow.rest === 1) return "none";
    const v = scrollY.get();
    const y = grow.tuck + Math.max(0, Math.min(v, HOLD) - grow.pin);
    const p = Math.min(v / GROWTH, 1);
    return `translateY(${y}px) scale(${grow.rest + (1 - grow.rest) * p})`;
  });
  // Desktop only, and only once the card has finished growing: a film cutting scenes while the card is
  // still being scaled reads as flicker.
  const [rolling, setRolling] = useState(false);
  const [warm, setWarm] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => {
    // Below the desktop breakpoint the card never grows, so there is no parked window to key off; the
    // observer below drives it there instead.
    if (grow.rest === 1 || reduce) return;
    // Start buffering as soon as the page moves, but only play once the card is parked at full size, so the
    // file is already decoded by the time anyone sees it move.
    if (v > 60) setWarm(true);
    setRolling(v >= GROWTH && v <= HOLD);
  });
  // Phones and tablets: the card is a plain tile, so it plays whenever it is on screen and stops when it is not.
  useEffect(() => {
    const el = film.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (innerWidth >= 1200) return;
        if (e.isIntersecting) setWarm(true);
        setRolling(e.isIntersecting);
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section ref={section} className="relative flex w-full flex-col items-center overflow-clip bg-white pb-[100px] pt-[128px] md:pb-[160px] md:pt-[158px] lg:h-[175vh] lg:min-h-[calc((1016px+max(1640px,112vw)*0.3214)/0.98)] lg:pb-0 lg:pt-[194px]">
      <div aria-hidden className="absolute inset-0 z-0 flex items-center justify-center overflow-clip">
        <img src={sky} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 100%" }} />
      </div>

      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-5">
          <div className="flex w-full flex-col items-center gap-[30px] md:gap-10">
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-wrap items-center justify-center gap-x-[10px] gap-y-0 md:gap-[30px]">
                <Appear y={20} delay={0.1}>
                  <h1 className="t-h1">{text.titleBefore}</h1>
                </Appear>
                <div className="flex h-10 w-[37px] items-center justify-center md:h-[60px] md:w-[74px] lg:h-[84px] lg:w-[104px]">
                  <Appear y={20} delay={0.2} rotate={-16} className="flex size-[37px] shrink-0 items-center justify-center rounded-[8px] bg-white md:size-[74px] md:rounded-[16px] lg:size-[104px] lg:rounded-[24px] [filter:drop-shadow(rgba(0,0,0,0.1)_0px_8px_6px)_drop-shadow(rgba(0,0,0,0.3)_0px_3px_3px)]">
                    <img src={gl.mark} alt="Goodluck" className="size-[80%] object-contain" />
                  </Appear>
                </div>
                <Appear y={20} delay={0.3}>
                  <h1 className="t-h1">{text.titleAfter}</h1>
                </Appear>
              </div>
              <Appear y={20} delay={0.4} className="mt-[10px] max-w-[600px] md:mt-5">
                <p className="t-lead text-center text-muted">
                  Our qualified migration agents and education counsellors will deal with your application to study in{" "}
                  <span className="inline-flex translate-y-[3px] items-center gap-[3px] align-baseline">
                    {destinationFlags.map((d, i) => (
                      <span key={d.name} className={`block size-[22px] overflow-hidden rounded-[6px] ring-1 ring-black/10 ${i % 2 ? "rotate-[6deg]" : "-rotate-[6deg]"}`}>
                        <img src={d.flag} alt={d.name} className="size-full object-cover" />
                      </span>
                    ))}
                  </span>
                </p>
              </Appear>
            </div>
            <Appear y={20} delay={0.5} className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
              <PillButton href="/contact/book-consultation">{text.bookCta}</PillButton>
              <FlatButton href="/services">{text.servicesCta}</FlatButton>
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

          <Appear y={30} delay={0.7} className="w-full">
            <div ref={film} className="mx-auto w-full max-w-[560px] lg:max-w-[1100px]">
              <motion.div
                style={{ transform: filmTransform }}
                className="group relative w-full overflow-hidden rounded-[22px] bg-ink shadow-[0_40px_90px_-40px_rgba(29,29,29,0.55)] ring-1 ring-white/50 will-change-transform"
              >
                {/* A chosen film has no short silent cut and no still of its own, so it plays in the card as
                    well and shows its own first frame. The shipped poster belongs to the shipped film only. */}
                <VideoDialog src={filmSrc ?? gl.film} loopSrc={filmSrc ?? gl.filmLoop} poster={filmSrc ? undefined : gl.filmPoster} title={text.videoTitle} inline={rolling} prefetch={warm} bare className="aspect-video w-full" />
              </motion.div>
            </div>
          </Appear>
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
