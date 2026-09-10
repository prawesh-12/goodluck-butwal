"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gl } from "@/config/assets";
import { nav } from "@/config/site";
import { PillButton } from "@/components/ui/button";
import { Img } from "@/components/ui/img";

function BlurTop() {
  const layers = [0.078125, 0.15625, 0.3125, 0.625, 1.25, 2.5, 5, 10];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[8] h-[60px] overflow-hidden md:h-[100px]">
      {layers.map((b, i) => {
        const s = i * 12.5;
        const mask = i === 7 ? `linear-gradient(to top, rgba(0,0,0,0) ${s}%, #000 ${s + 12.5}%, #000 100%)` : `linear-gradient(to top, rgba(0,0,0,0) ${s - 12.5}%, #000 ${s}%, #000 ${s + 12.5}%, rgba(0,0,0,0) ${s + 25}%)`;
        return <div key={b} className="absolute inset-0" style={{ zIndex: i + 1, backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
      })}
    </div>
  );
}

export type NavText = { bookCta: string; loginCta: string; menuOpen: string; menuClose: string };

export function Nav({ text }: { text: NavText }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const [lastPath, setLastPath] = useState(path);
  // Closing in an effect left the menu open over the new page for a frame.
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }
  // No point offering the booking CTA to someone already on the contact pages.
  const onContact = path === "/contact" || path.startsWith("/contact/");
  return (
    <>
      <BlurTop />
      <div className="fixed inset-x-0 top-0 z-[9] flex flex-col items-center py-4 md:py-5">
        <div className="w-full px-4 md:w-auto md:max-w-[860px] md:px-5 lg:max-w-[1280px] lg:px-6">
          <div className="flex h-[52px] items-center gap-4 overflow-hidden rounded-full bg-white p-[10px] shadow-[0_0_0_2px_rgba(221,229,237,0.7)] md:h-[54px] md:shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:h-[58px] lg:gap-5">
            <Link href="/" aria-label="Goodluck Education and Migration, home" className="block h-7 shrink-0 md:h-8">
              <Img src={gl.logo} alt="Goodluck Education and Migration" w={320} className="h-full w-auto object-contain" />
            </Link>
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {nav.map((l) => {
                const active = path === l.href || path.startsWith(l.href + "/");
                return (
                  <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-full px-3 py-2 text-[16px] font-semibold leading-[20.8px] transition-colors duration-200 hover:bg-surface hover:text-ink ${active ? "bg-surface text-ink" : "text-muted"}`}>
                    {l.label}
                  </Link>
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
              <Link href="/admin/login" className="hidden h-[34px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-surface px-3 text-[14px] font-semibold leading-[18.2px] text-ink transition-colors duration-200 hover:bg-hairline md:inline-flex lg:h-[38px] lg:px-4">
                {text.loginCta}
              </Link>
              <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? text.menuClose : text.menuOpen} className="relative flex size-8 items-center justify-center rounded-full bg-ink md:size-[34px] lg:hidden">
                <span className={`absolute h-[2px] w-5 rounded-[2px] bg-white transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`} />
                <span className={`absolute h-[2px] w-5 rounded-[2px] bg-white transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {open && (
              <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-[10px] flex flex-col gap-1 rounded-[26px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:hidden" aria-label="Mobile">
                {nav.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[16px] font-semibold leading-[20.8px] text-muted hover:bg-surface hover:text-ink">
                    {l.label}
                  </Link>
                ))}
                <div className="mt-2 flex items-center justify-center gap-2 border-t border-hairline px-2 pt-3">
                  {!onContact && (
                    <span className="md:hidden">
                      <PillButton href="/contact/book-consultation" tone="dark" size="sm">
                        {text.bookCta}
                      </PillButton>
                    </span>
                  )}
                  <Link href="/admin/login" className="inline-flex h-[34px] items-center justify-center whitespace-nowrap rounded-full bg-surface px-4 text-[14px] font-semibold leading-[18.2px] text-ink hover:bg-hairline md:hidden">
                    {text.loginCta}
                  </Link>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[7] bg-black/30 backdrop-blur-[10px] lg:hidden" />}
      </AnimatePresence>
    </>
  );
}
