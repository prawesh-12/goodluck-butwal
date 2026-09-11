import Link from "next/link";
import type { ReactNode } from "react";
import { img } from "@/config/assets";
import { formatDate } from "@/lib/utils/datetime";
import { Appear } from "@/components/ui/appear";
import { Badge, Chip } from "@/components/ui/bits";
import { CARD_SIZES, Img } from "@/components/ui/img";
import { HeroBackdrop } from "@/components/shared/hero-backdrop";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
        <HeroBackdrop src={bg === "sky" ? img.heroSky : img.fieldSky} />
      </div>
      {clouds && (
        <>
          <Img aria-hidden src={img.cloud1} alt="" w={640} className="pointer-events-none absolute z-[1] hidden w-[602px] max-w-none opacity-80 lg:block" style={{ top: 50, left: -50 }} loading="lazy" decoding="async" />
          <Img aria-hidden src={img.cloud3} alt="" w={640} className="pointer-events-none absolute z-[1] hidden w-[584px] max-w-none opacity-80 lg:block" style={{ top: -150, right: 30 }} loading="lazy" decoding="async" />
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

export function NewsCard({ article, delay = 0, className, href }: { article: Article; delay?: number; className?: string; href?: string }) {
  return (
    <Appear delay={delay} className={cx("p-1", className)}>
      <Link href={href ?? `/news/${article.slug}`} aria-label={article.title} className="group flex flex-col gap-[10px] overflow-clip rounded-[10px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:rounded-[20px]">
        <div className="relative aspect-[1533/458] w-full overflow-clip rounded-[6px] lg:rounded-[10px]">
          <Img src={article.image} alt={article.title} sizes={CARD_SIZES} className="absolute inset-0 size-full scale-[1.01] object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" decoding="async" />
        </div>
        <div className="flex flex-wrap items-center gap-[10px] p-4 lg:p-[10px]">
          <span className="inline-flex h-7 items-center rounded-full bg-surface px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] text-black">{article.category}</span>
          <time dateTime={article.date} className="t-small text-muted">{formatDate(article.date)}</time>
        </div>
      </Link>
    </Appear>
  );
}

export function TeamCard({ name, role, photo, office, delay = 0, href }: { name: string; role: string; photo: string; office?: string; delay?: number; href?: string }) {
  const body = (
    <>
      <div className="aspect-[345/400] w-full overflow-clip rounded-[10px] bg-surface md:rounded-[20px]">
        <Img src={photo} alt={name} sizes={CARD_SIZES} className="size-full object-cover object-top transition-transform duration-500 hover:scale-[1.03]" loading="lazy" decoding="async" />
      </div>
      <div className="flex flex-col items-center gap-[2px]">
        <h3 className="t-h5 text-center">{name}</h3>
        <p className="t-small text-center text-muted">{role}</p>
        {office && <p className="t-small text-center text-muted">{office}</p>}
      </div>
    </>
  );
  return (
    <Appear delay={delay} className="flex flex-col items-center gap-4">
      {href ? (
        <Link href={href} aria-label={name} className="flex w-full flex-col items-center gap-4">{body}</Link>
      ) : (
        body
      )}
    </Appear>
  );
}

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

export function Field({ label, name, type = "text", placeholder, textarea, className, required, min, max, help }: { label: string; name: string; type?: string; placeholder?: string; textarea?: boolean; className?: string; required?: boolean; min?: string; max?: string; help?: string }) {
  return (
    <label className={cx("flex flex-col items-start gap-[10px]", className)}>
      <span className="t-base text-muted">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} required={required} className="h-[150px] w-full resize-none rounded-[10px] bg-white p-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline placeholder:text-muted/60 focus:ring-ink/40" />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required} min={min} max={max} className="h-[50px] w-full rounded-[10px] bg-white px-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline placeholder:text-muted/60 focus:ring-ink/40" />
      )}
      {help ? <span className="t-small text-muted">{help}</span> : null}
    </label>
  );
}

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
          <Img src={icon} alt="" w={40} className="size-5 object-contain" loading="lazy" decoding="async" />
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <h3 className={cx("t-stat", t.value)}>{value}</h3>
        <p className={cx("t-base", t.text)}>{text}</p>
      </div>
    </div>
  );
}
