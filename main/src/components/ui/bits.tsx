import type { CSSProperties, ReactNode } from "react";
import { img } from "@/lib/assets";
import { social } from "@/lib/site";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// Brand marks from extras/social_icons, so they keep their own colours rather than taking the text colour.
export function SocialLinks({
  className,
  links = social,
}: {
  className?: string;
  links?: { label: string; href: string; icon: string }[];
}) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      {links.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener" aria-label={s.label} className="flex size-9 items-center justify-center rounded-full ring-1 ring-hairline transition-transform duration-200 hover:-translate-y-[2px]">
          <img src={s.icon} alt="" className="size-5" loading="lazy" decoding="async" />
        </a>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "surface", className }: { children: ReactNode; tone?: "surface" | "white"; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-[38px] items-center justify-center whitespace-nowrap rounded-full px-5 text-[14px] font-medium leading-[18.2px] text-ink",
        tone === "surface" ? "bg-surface" : "bg-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Small pill used in feature chips and the use-case list.
export function Chip({ children, tone = "surface", wrap }: { children: ReactNode; tone?: "surface" | "white"; wrap?: boolean }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] text-muted", wrap ? "min-h-7 whitespace-normal text-left" : "h-7 whitespace-nowrap", tone === "surface" ? "bg-surface" : "bg-white")}>
      {children}
    </span>
  );
}

// Chevron list row (security list, pricing features).
export function CheckRow({ children, icon = img.chevron, color = "text-muted", iconW = 6 }: { children: ReactNode; icon?: string; color?: string; iconW?: number }) {
  return (
    <div className="flex items-start gap-[6px]">
      <span className="flex h-[22px] items-center">
        <img src={icon} alt="" style={{ width: iconW, height: 10 }} loading="lazy" decoding="async" />
      </span>
      <p className={cx("text-[16px] font-medium leading-[20.8px]", color)}>{children}</p>
    </div>
  );
}

// Infinite marquee. Children are rendered twice; the track slides one copy per cycle.
export function Ticker({ children, gap, speed, className, reverse, align = "center" }: { children: ReactNode; gap: number; speed: number; className?: string; reverse?: boolean; align?: "center" | "end" }) {
  return (
    <div className={cx("ticker overflow-clip", className)}>
      <div className={cx("ticker-track", reverse && "reverse", align === "end" ? "items-end" : "items-center")} style={{ "--gap": `var(--gap-override, ${gap}px)`, "--speed": `${speed}s` } as CSSProperties}>
        {children}
        {children}
      </div>
    </div>
  );
}

// Full-bleed background photo with the white fades Framer uses on top and/or bottom.
// soft: the fade only reaches white at the very edge, for a section that meets another photo instead of a white one.
export function SectionBg({ src, top, bottom, soft, position = "50% 0%", children, className }: { src: string; top?: boolean; bottom?: boolean; soft?: boolean; position?: string; children?: ReactNode; className?: string }) {
  // Tailwind only generates classes it can read in full, so the four gradients are spelled out.
  const fade = "absolute -left-[10px] -right-[10px] z-[2] h-[100px] md:h-[160px] lg:h-[200px]";
  const topFade = soft ? "bg-[linear-gradient(0deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_55%,#fff_100%)]" : "bg-[linear-gradient(0deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_25%,#fff_50%)]";
  const bottomFade = soft ? "bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_55%,#fff_100%)]" : "bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_25%,#fff_50%)]";
  return (
    <div aria-hidden className={cx("pointer-events-none absolute inset-0 z-0 overflow-clip", className)}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} loading="lazy" decoding="async" />
      {top && <div className={cx(fade, "-top-[1px]", topFade)} />}
      {bottom && <div className={cx(fade, "-bottom-[1px]", bottomFade)} />}
      {children}
    </div>
  );
}
