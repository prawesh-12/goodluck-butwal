"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

// Every `m.` component on the public site draws its features from here, so the layout chunk
// ships the animation and gesture modules only, not the whole Motion runtime.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
