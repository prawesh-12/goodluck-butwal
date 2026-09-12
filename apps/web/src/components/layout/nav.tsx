"use client";

import { Link } from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { gl } from "@/config/assets";
import { nav, type NavIcon } from "@/config/site";
import { BookOpen, Building2, Globe, PenLine } from "lucide-react";
import { PillButton } from "@/components/ui/button";
import { Img } from "@/components/ui/img";

function BlurTop() {
  // The two lightest layers, 0.078 px and 0.156 px, blurred less than a fifth of a device pixel and
  // changed nothing visible (max 2/255), so the stack starts at 0.3125 px and keeps each band where it was.
  const layers = [0.3125, 0.625, 1.25, 2.5, 5, 10];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[8] h-[60px] overflow-hidden md:h-[100px]">
      {layers.map((b, n) => {
        const i = n + 2;
        const s = i * 12.5;
        const mask = i === 7 ? `linear-gradient(to top, rgba(0,0,0,0) ${s}%, #000 ${s + 12.5}%, #000 100%)` : `linear-gradient(to top, rgba(0,0,0,0) ${s - 12.5}%, #000 ${s}%, #000 ${s + 12.5}%, rgba(0,0,0,0) ${s + 25}%)`;
        // The mask only shows a band of each layer, so the backdrop is clipped to that band plus the
        // blur's reach (4 sigma). The compositor then blurs the band instead of the whole strip.
        const lo = i === 7 ? 87.5 : Math.max(0, s - 12.5);
        const hi = i === 7 ? 100 : Math.min(100, s + 25);
        const reach = 4 * b;
        const clip = `inset(${hi === 100 ? 0 : `calc(${100 - hi}% - ${reach}px)`} 0 ${lo === 0 ? 0 : `calc(${lo}% - ${reach}px)`} 0)`;
        return <div key={b} className="absolute inset-0" style={{ zIndex: i + 1, backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: mask, WebkitMaskImage: mask, clipPath: clip }} />;
      })}
    </div>
  );
}

const icons: Record<NavIcon, typeof Globe> = { globe: Globe, building: Building2, book: BookOpen, pen: PenLine };

export type NavText = { bookCta: string; menuOpen: string; menuClose: string };

export function Nav({ text }: { text: NavText }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const path = usePathname();
  const [lastPath, setLastPath] = useState(path);
  // Closing in an effect left the menu open over the new page for a frame.
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
    setMenu(null);
  }
  const on = (href: string) => path === href || path.startsWith(href + "/");
  const item = "whitespace-nowrap rounded-full px-3 py-2 text-[16px] font-semibold leading-[20.8px] transition-colors duration-200 hover:bg-surface hover:text-ink";
  const tone = (active: boolean) => (active ? "bg-surface text-ink" : "text-muted");
  // No point offering the booking CTA to someone already on the contact pages.
  const onContact = path === "/contact" || path.startsWith("/contact/");
  return (
    <>
      <BlurTop />
      <div className="fixed inset-x-0 top-0 z-[9] flex flex-col items-center py-4 md:py-5">
        <div className="w-full px-4 md:w-auto md:max-w-[860px] md:px-5 lg:max-w-[1280px] lg:px-6">
          <div className="flex h-[52px] items-center gap-4 rounded-full bg-white p-[10px] shadow-[0_0_0_2px_rgba(221,229,237,0.7)] md:h-[54px] md:shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:h-[58px] lg:gap-5">
            <Link href="/" prefetch={path === "/" ? false : undefined} aria-label="Goodluck Education and Migration, home" className="block h-7 shrink-0 md:h-8">
              <Img src={gl.logo} alt="Goodluck Education and Migration" w={320} className="h-full w-auto object-contain" />
            </Link>
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {nav.filter((l) => !l.menuOnly).map((l) => {
                if (!l.children) {
                  return (
                    <Link key={l.href} href={l.href} className={`${item} ${tone(on(l.href))}`}>
                      {l.label}
                    </Link>
                  );
                }
                const shown = menu === l.href;
                const active = on(l.href) || l.children.some((c) => on(c.href));
                return (
                  <div
                    key={l.href}
                    className="relative"
                    onMouseEnter={() => setMenu(l.href)}
                    onMouseLeave={() => setMenu(null)}
                    onFocus={() => setMenu(l.href)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(null);
                    }}
                    onKeyDown={(e) => e.key === "Escape" && setMenu(null)}
                  >
                    <Link href={l.href} aria-expanded={shown} className={`${item} inline-flex items-center gap-1.5 ${tone(active)}`}>
                      {l.label}
                      <svg width="10" height="7" viewBox="0 0 12 8" aria-hidden="true" className={`transition-transform duration-200 ${shown ? "rotate-180" : ""}`}>
                        <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <AnimatePresence>
                      {shown && (
                        <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="absolute left-0 top-full pt-5">
                          <div className="grid w-[460px] grid-cols-2 gap-1 rounded-[26px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)]">
                            {l.children.map((c) => {
                              const Icon = icons[c.icon];
                              // The Destinations tile shares the parent's href, so it only reads as current on that page itself.
                              const here = c.href === l.href ? path === c.href : on(c.href);
                              return (
                                <Link key={c.href} href={c.href} className={`flex items-center gap-3 rounded-[18px] p-3 text-[16px] font-semibold leading-[20.8px] transition-colors duration-200 hover:bg-surface hover:text-ink ${tone(here)}`}>
                                  <span className="icon-dark flex size-10 shrink-0 items-center justify-center rounded-[10px] text-white ring-1 ring-inset ring-white/10">
                                    <Icon size={20} strokeWidth={1.8} aria-hidden />
                                  </span>
                                  {c.label}
                                </Link>
                              );
                            })}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
            <div className="ml-auto flex shrink-0 items-center justify-end gap-[6px] md:gap-[10px]">
              {!onContact && (
                <div className="hidden md:block">
                  <PillButton href="/contact/book-consultation" tone="dark" size="sm">
                    {text.bookCta}
                  </PillButton>
                </div>
              )}
              <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? text.menuClose : text.menuOpen} className="relative flex size-8 items-center justify-center rounded-full bg-ink md:size-[34px] lg:hidden">
                <span className={`absolute h-[2px] w-5 rounded-[2px] bg-white transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`} />
                <span className={`absolute h-[2px] w-5 rounded-[2px] bg-white transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {open && (
              <m.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-[10px] flex flex-col gap-1 rounded-[26px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:hidden" aria-label="Mobile">
                {nav.map((l) => (
                  <Fragment key={l.href}>
                    <Link href={l.href} className="rounded-full px-4 py-2 text-[16px] font-semibold leading-[20.8px] text-muted hover:bg-surface hover:text-ink">
                      {l.label}
                    </Link>
                    {l.children?.map((c) => {
                      const Icon = icons[c.icon];
                      return (
                        <Link key={c.href} href={c.href} className="flex items-center gap-3 rounded-full py-2 pl-6 pr-4 text-[15px] font-medium leading-[20.8px] text-muted hover:bg-surface hover:text-ink">
                          <Icon size={18} strokeWidth={1.8} aria-hidden />
                          {c.label}
                        </Link>
                      );
                    })}
                  </Fragment>
                ))}
                {!onContact && (
                  <div className="mt-2 flex items-center justify-center border-t border-hairline px-2 pt-3 md:hidden">
                    <PillButton href="/contact/book-consultation" tone="dark" size="sm">
                      {text.bookCta}
                    </PillButton>
                  </div>
                )}
              </m.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {open && <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[7] bg-black/30 backdrop-blur-[10px] lg:hidden" />}
      </AnimatePresence>
    </>
  );
}
