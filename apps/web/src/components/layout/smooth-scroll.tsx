"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";

// lerp 0.08: one 600px wheel tick settles in about 1.4s.
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only wheel input is smoothed, so a touch device pays the bytes and the frame loop for
    // scrolling that stays native either way.
    if (!matchMedia("(pointer: fine)").matches) return;
    // Fetched after mount so it stays out of the initial bundle.
    let cancelled = false;
    let raf = 0;
    let lenis: Lenis | null = null;
    let onClick: ((e: MouseEvent) => void) | null = null;

    void import("lenis").then(({ default: LenisClass }) => {
      if (cancelled) return;
      lenis = new LenisClass({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 1 });
      lenisRef.current = lenis;
      // Lenis expects a permanent rAF loop, but an always-on rAF makes Chrome re-tick every CSS loop
      // animation on the main thread each frame while nothing scrolls, so the loop runs only while
      // Lenis is easing. Its clock is reset first, else the first frame's delta is the idle gap.
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = lenis?.isScrolling === "smooth" ? requestAnimationFrame(loop) : 0;
      };
      const wake = () => {
        if (raf || !lenis) return;
        lenis.time = 0;
        raf = requestAnimationFrame(loop);
      };
      lenis.on("virtual-scroll", wake);
      // Hash links go through Lenis so anchors ease too.
      onClick = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest("a[href*='#']") as HTMLAnchorElement | null;
        if (!a) return;
        const url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname || !url.hash) return;
        const el = document.querySelector(url.hash);
        if (!el) return;
        e.preventDefault();
        wake();
        lenis?.scrollTo(el as HTMLElement, { offset: -100 });
        history.pushState(null, "", url.hash);
      };
      document.addEventListener("click", onClick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (onClick) document.removeEventListener("click", onClick);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Every page opens at the top, whatever was scrolled before. Without this, Lenis keeps easing from the old position (often the footer link you clicked).
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
