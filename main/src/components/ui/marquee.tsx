import type { ComponentPropsWithoutRef, ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: ComponentPropsWithoutRef<"div"> & { children: ReactNode; reverse?: boolean; pauseOnHover?: boolean; vertical?: boolean; repeat?: number }) {
  return (
    <div {...props} className={cx("group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]", vertical ? "flex-col" : "flex-row", className)}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          className={cx(
            "flex shrink-0 justify-around gap-(--gap)",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
