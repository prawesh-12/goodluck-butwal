import Link from "next/link";
import type { ReactNode } from "react";
import { img } from "@/lib/assets";
import { formatDate } from "@/lib/datetime";
import { Appear } from "@/components/ui/appear";
import { Badge, Chip } from "@/components/ui/bits";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// Inner-page hero: sky or field photo with a white overlay, two faded clouds on desktop, centred copy.
// Top padding is 128 / 158 / 194 by breakpoint; bottom padding and the gap to `after` vary per page.
export function InnerHero({
  badge,
  badgeTone = "white",
  title,
  size = "lg",
  lead,
  bg = "sky",
  overlay = "linear-gradient(180deg,rgba(255,255,255,0.5) 0%,#fff 50%)",
  clouds = true,
  pb = "pb-[60px] md:pb-20 lg:pb-[100px]",
  gap = "gap-[30px] md:gap-10 lg:gap-[50px]",
  width = 860,
  align = "center",
  children,
  after,
  className,
}: {
  badge?: string;
  badgeTone?: "white" | "surface" | "chip" | "chip-white";
  title: ReactNode;
  size?: "lg" | "md";
  lead?: string;
  bg?: "sky" | "field";
  overlay?: string;
  clouds?: boolean;
  pb?: string;
  gap?: string;
  width?: 860 | 1260;
  align?: "center" | "left";
  children?: ReactNode;
  after?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("relative flex w-full flex-col items-center overflow-clip pt-32 md:pt-[158px] lg:pt-[194px]", pb, className)}>
      <div aria-hidden className="absolute inset-0 z-0 overflow-clip">
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: overlay }} />
        <img src={bg === "sky" ? img.heroSky : img.fieldSky} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 0%" }} loading="lazy" decoding="async" />
      </div>
      {clouds && (
        <>
          <img aria-hidden src={img.cloud1} alt="" className="pointer-events-none absolute z-[1] hidden w-[602px] max-w-none opacity-80 lg:block" style={{ top: 50, left: -50 }} loading="lazy" decoding="async" />
          <img aria-hidden src={img.cloud3} alt="" className="pointer-events-none absolute z-[1] hidden w-[584px] max-w-none opacity-80 lg:block" style={{ top: -150, right: 30 }} loading="lazy" decoding="async" />
        </>
      )}
      <div className={cx("relative z-[2] w-full", width === 860 ? "px-4 md:max-w-[860px] md:px-5 lg:px-[30px]" : "container-x")}>
        <div className={cx("flex w-full flex-col", gap, align === "center" ? "items-center" : "items-start")}>
          <Appear y={10} duration={0.6} className={cx("flex w-full flex-col gap-[10px]", align === "center" ? "items-center text-center" : "items-start")}>
            {badge && (badgeTone === "chip" ? <Chip>{badge}</Chip> : badgeTone === "chip-white" ? <Chip tone="white">{badge}</Chip> : <Badge tone={badgeTone} className="ring-1 ring-hairline">{badge}</Badge>)}
            <h1 className={size === "lg" ? "t-h1-md" : "t-h2"}>{title}</h1>
            {lead && <p className="t-body text-muted">{lead}</p>}
            {children}
          </Appear>
          {after}
        </div>
      </div>
    </section>
  );
}

export type Article = { slug: string; title: string; date: string; category: string; image: string; excerpt: string; width?: number; height?: number };

// Article banners already carry the headline, so the card shows the banner, the category and the date.
export function NewsCard({ article, delay = 0, className }: { article: Article; delay?: number; className?: string }) {
  return (
    <Appear delay={delay} className={cx("p-1", className)}>
      <Link href={`/news/${article.slug}`} aria-label={article.title} className="group flex flex-col gap-[10px] overflow-clip rounded-[10px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:rounded-[20px]">
        <div className="aspect-[1533/458] w-full overflow-clip rounded-[6px] lg:rounded-[10px]">
          <img src={article.image} alt={article.title} className="size-full scale-[1.01] object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" decoding="async" />
        </div>
        <div className="flex flex-wrap items-center gap-[10px] p-4 lg:p-[10px]">
          <span className="inline-flex h-7 items-center rounded-full bg-surface px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] text-black">{article.category}</span>
          <time dateTime={article.date} className="t-small text-muted">{formatDate(article.date)}</time>
        </div>
      </Link>
    </Appear>
  );
}

// Team member: round portrait, name and role, as on the reference team grid.
export function TeamCard({ name, role, photo, office, delay = 0 }: { name: string; role: string; photo: string; office?: string; delay?: number }) {
  return (
    <Appear delay={delay} className="flex flex-col items-center gap-4">
      <div className="aspect-[345/400] w-full overflow-clip rounded-[10px] bg-surface md:rounded-[20px]">
        <img src={photo} alt={name} className="size-full object-cover object-top transition-transform duration-500 hover:scale-[1.03]" loading="lazy" decoding="async" />
      </div>
      <div className="flex flex-col items-center gap-[2px]">
        <h3 className="t-h5 text-center">{name}</h3>
        <p className="t-small text-center text-muted">{role}</p>
        {office && <p className="t-small text-center text-muted">{office}</p>}
      </div>
    </Appear>
  );
}

// Label-and-title card used for services, steps and highlights.
export function InfoCard({ label, title, line, tone = "surface", icon, className, delay = 0 }: { label?: string; title: string; line?: string; tone?: "surface" | "white" | "dark" | "blue"; icon?: ReactNode; className?: string; delay?: number }) {
  const t = {
    surface: { card: "bg-surface", title: "", text: "text-muted", chip: "bg-white text-muted" },
    white: { card: "bg-white", title: "", text: "text-muted", chip: "bg-surface text-muted" },
    dark: { card: "icon-dark", title: "!text-white", text: "text-gray-text", chip: "bg-white/10 text-white" },
    blue: { card: "bg-[linear-gradient(135deg,#406ae4_0%,#5290f4_100%)]", title: "!text-white", text: "text-surface", chip: "bg-white/15 text-white" },
  }[tone];
  return (
    <Appear delay={delay} className={cx("flex flex-col items-start gap-5 overflow-hidden rounded-[10px] p-5 md:gap-[30px] md:rounded-[30px] md:p-[30px]", t.card, className)}>
      {icon}
      <div className="flex flex-col items-start gap-[10px]">
        {label && <span className={cx("inline-flex h-7 items-center rounded-full px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px]", t.chip)}>{label}</span>}
        <div className="flex flex-col items-start gap-[6px]">
          <h3 className={cx("t-h5", t.title)}>{title}</h3>
          {line && <p className={cx("t-base", t.text)}>{line}</p>}
        </div>
      </div>
    </Appear>
  );
}

// Section heading block: badge, title, optional lead. Centred by default.
export function SectionHead({ badge, title, lead, align = "center", badgeTone = "surface", className }: { badge?: string; title: ReactNode; lead?: string; align?: "center" | "left"; badgeTone?: "surface" | "white"; className?: string }) {
  const centre = align === "center";
  return (
    <Appear className={cx("flex w-full flex-col gap-[10px]", centre ? "max-w-[800px] items-center text-center" : "items-start", className)}>
      {badge && <Badge tone={badgeTone} className="ring-1 ring-hairline">{badge}</Badge>}
      <h2 className="t-h2">{title}</h2>
      {lead && <p className="t-body text-muted">{lead}</p>}
    </Appear>
  );
}

// Form field as measured: label 15/16px muted, 50px white box, 10px radius, hairline border.
export function Field({ label, name, type = "text", placeholder, textarea, className, required }: { label: string; name: string; type?: string; placeholder?: string; textarea?: boolean; className?: string; required?: boolean }) {
  return (
    <label className={cx("flex flex-col items-start gap-[10px]", className)}>
      <span className="t-base text-muted">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} required={required} className="h-[150px] w-full resize-none rounded-[10px] bg-white p-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline placeholder:text-muted/60 focus:ring-ink/40" />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required} className="h-[50px] w-full rounded-[10px] bg-white px-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline placeholder:text-muted/60 focus:ring-ink/40" />
      )}
    </label>
  );
}

// Stat card: phone p20 r10 auto height, tablet 250px p30 r30, desktop 280px square on the homepage.
export function StatCard({ label, value, text, icon, tone = "white", className }: { label: string; value: string; text: string; icon: string; tone?: "white" | "light" | "dark" | "blue"; className?: string }) {
  const t = {
    white: { card: "bg-white", label: "text-ink", value: "", text: "text-muted", icon: "icon-dark" },
    light: { card: "bg-surface", label: "text-ink", value: "", text: "text-muted", icon: "bg-[linear-gradient(133deg,#406ae4_0%,#3b82f6_100%)]" },
    dark: { card: "icon-dark", label: "text-white", value: "!text-white", text: "text-gray-text", icon: "bg-white" },
    blue: { card: "bg-[linear-gradient(90deg,#406ae4_0%,#3b82f6_100%)]", label: "text-white", value: "!text-white", text: "text-surface", icon: "bg-black" },
  }[tone];
  return (
    <div className={cx("flex flex-col justify-between overflow-hidden rounded-[10px] p-5 md:rounded-[30px] md:p-[30px]", t.card, className)}>
      <div className="flex items-start gap-[10px] pb-[30px]">
        <p className={cx("t-base w-[154px] md:w-[105px]", t.label)}>{label}</p>
        <span className={cx("ml-auto flex size-10 shrink-0 items-center justify-center overflow-clip rounded-full", t.icon)}>
          <img src={icon} alt="" className="size-5 object-contain" loading="lazy" decoding="async" />
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <h3 className={cx("t-stat", t.value)}>{value}</h3>
        <p className={cx("t-base", t.text)}>{text}</p>
      </div>
    </div>
  );
}
