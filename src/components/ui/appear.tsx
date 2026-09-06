"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

// Framer's "appear on scroll" preset: spring, no bounce, y offset, staggered delay.
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0.001, y, rotate: 0 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once, amount: 0.05 }}
      transition={{ type: "spring", bounce: 0, duration, delay }}
    >
      {children}
    </motion.div>
  );
}
