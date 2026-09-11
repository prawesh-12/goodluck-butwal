import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

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
    <div {...props} className={cx("group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem]", vertical ? "flex-col" : "flex-row", className)}>
      <div
        style={{ "--repeat": repeat } as CSSProperties}
        className={cx(
          "flex shrink-0 gap-(--gap)",
          vertical ? "animate-marquee-vertical flex-col" : "animate-marquee w-max flex-row",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {Array.from({ length: repeat }, (_, i) => (
          <div key={i} className={cx("flex shrink-0 justify-around gap-(--gap)", vertical ? "flex-col" : "flex-row")}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
