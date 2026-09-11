"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// The reveal itself is a CSS transition (see globals.css), so it keeps running when a JS frame
// loop stalls, which is what iOS Low Power Mode does to a Motion spring.
export function Appear({
  children,
  y = 20,
  delay = 0,
  duration = 1,
  rotate = 0,
  className,
  style,
  once = true,
}: {
  children: ReactNode;
  y?: number;
  delay?: number;
  duration?: number;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const vars = {
    "--appear-y": `${y}px`,
    "--appear-rotate": `${rotate}deg`,
    "--appear-duration": `${duration}s`,
    "--appear-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <div ref={ref} data-appear={shown ? "shown" : "hidden"} className={className} style={{ ...style, ...vars }}>
      {children}
    </div>
  );
}
