"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// The reference runs Lenis. Its wheel curve fits a time-based lerp of about 0.08 (one 600px tick settles in ~1.4s).
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 1 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    // Hash links go through Lenis so anchors ease too.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.querySelector(url.hash);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -100 });
      history.pushState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("click", onClick); lenis.destroy(); };
  }, []);
  return null;
}
