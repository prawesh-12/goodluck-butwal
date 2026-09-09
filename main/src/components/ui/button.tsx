"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Variants } from "motion/react";
import { img } from "@/config/assets";

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
// Hoisted, because motion(Link) inside the body would be a new component type on every render
// and React would remount the link instead of updating it.
const MotionLink = motion(Link);

function ArrowChip({ side, lg, flip, variants }: { side: "left" | "right"; lg: boolean; flip: boolean; variants: Variants }) {
  return (
    <motion.span
      aria-hidden
      variants={variants}
      transition={spring}
      className={cx(
        "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white",
        lg ? "size-[25px] md:size-[27px] lg:size-[31px]" : "size-[18px] lg:size-[22px]",
        side === "left" ? (lg ? "left-[6px] lg:left-2" : "left-[7px] lg:left-2") : lg ? "right-[6px] lg:right-2" : "right-[7px] lg:right-2",
      )}
    >
      <img src={flip ? img.arrowLeft : img.arrow} alt="" className="h-2 w-3" loading="lazy" decoding="async" />
    </motion.span>
  );
}

export function PillButton({
  href,
  children,
  tone = "blue",
  size = "lg",
  className,
  iconSide = "right",
}: {
  href: string;
  children: ReactNode;
  tone?: "blue" | "dark";
  size?: "lg" | "sm";
  className?: string;
  iconSide?: "left" | "right";
}) {
  const lg = size === "lg";
  const flip = iconSide === "left";
  const big = 44 / 31;
  // The hidden chip sits 50px past its slot so nothing peeks out of the pill.
  const shift = 50;
  const chipVariants = flip
    ? {
        left: { rest: { x: 0, rotate: 0, scale: 1 }, hover: { x: -shift, rotate: -45, scale: big } },
        right: { rest: { x: shift, rotate: 45, scale: big }, hover: { x: 0, rotate: 0, scale: 1 } },
      }
    : {
        left: { rest: { x: -shift, rotate: -45, scale: big }, hover: { x: 0, rotate: 0, scale: 1 } },
        right: { rest: { x: 0, rotate: 0, scale: 1 }, hover: { x: shift, rotate: 45, scale: big } },
      };
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const A = external ? motion.a : MotionLink;
  return (
    <A
      href={href}
      initial="rest"
      animate="rest"
      whileHover="hover"
      className={cx("inline-flex items-center justify-center rounded-full", lg && "p-[6px] bg-white/10 backdrop-blur-[5px] ring-1 ring-inset", lg && (tone === "blue" ? "ring-white/70" : "ring-white"), className)}
    >
      <span
        className={cx(
          "relative flex items-center justify-center overflow-clip rounded-full whitespace-nowrap ring-1 ring-inset",
          tone === "blue" ? "ring-[#5290f4]" : "ring-ink",
          lg ? (flip ? "py-2 pl-11 pr-5 lg:py-[10px] lg:pl-[50px] lg:pr-[26px]" : "py-2 pl-5 pr-11 lg:py-[10px] lg:pl-[26px] lg:pr-[50px]") : "py-2 pl-4 pr-[34px] lg:py-[10px] lg:pl-6 lg:pr-10",
          tone === "blue" ? "btn-blue" : lg ? "btn-black" : "btn-black-sm",
        )}
      >
        <ArrowChip side="left" lg={lg} flip={flip} variants={chipVariants.left} />
        <motion.span
          variants={{ rest: { x: 0 }, hover: { x: (flip ? -1 : 1) * (lg ? 24 : 16) } }}
          transition={spring}
          className={cx("font-semibold text-white", lg ? "text-[16px] leading-[20.8px] md:text-[18px] md:leading-[23.4px]" : "text-[14px] leading-[18.2px]")}
        >
          {children}
        </motion.span>
        <ArrowChip side="right" lg={lg} flip={flip} variants={chipVariants.right} />
      </span>
    </A>
  );
}

export function FlatButton({
  href,
  children,
  tone = "white",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "white" | "dark";
  className?: string;
}) {
  const cls = cx(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-[26px] text-[16px] font-semibold leading-[20.8px] transition-colors duration-300 md:text-[18px] md:leading-[23.4px] lg:px-9 lg:py-[15px]",
    tone === "white" ? "bg-white py-[13px] text-ink hover:bg-black hover:text-white" : "bg-ink py-[14px] text-white hover:bg-hairline hover:text-ink",
    className,
  );
  if (href.startsWith("http") || href.startsWith("mailto:"))
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
