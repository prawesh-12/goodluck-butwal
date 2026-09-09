import Link from "next/link";
import { img } from "@/config/assets";
import type { PublicService } from "@/features/services/queries";
import { loadText } from "@/features/site-text/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, Chip } from "@/components/ui/bits";
import { VideoDialog } from "@/components/ui/video-dialog";

// White frame with the service artwork. A service with a reel shows the video's poster frame as the play thumbnail instead.
export function Artwork({ s, className, pad }: { s: Service; className: string; pad: string }) {
  return s.video && s.poster ? (
    <VideoDialog src={s.video} poster={s.poster} title={s.title} className={className} />
  ) : (
    <div className={`relative ${className}`}>
      <img src={s.image} alt={s.imageAlt} className={`absolute inset-0 size-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04] ${pad}`} loading="lazy" decoding="async" />
    </div>
  );
}

type Service = PublicService;

// Surface tile: artwork on white, then label, title, one line and an arrow. Same family as the office and info cards.
export function ServiceCard({ service, slug, label, title, line, className = "" }: { service: Service; slug: string; label: string; title: string; line?: string; image: string; imageAlt: string; className?: string }) {
  const s = service;
  return (
    <Link href={`/services/${slug}`} className={`group flex h-full flex-col gap-[6px] rounded-[10px] bg-surface p-[6px] md:rounded-[20px] ${className}`}>
      <Artwork s={s} pad="p-4" className="aspect-[4/3] w-full overflow-clip rounded-[6px] bg-white md:rounded-[14px]" />
      <div className="flex flex-1 items-start justify-between gap-4 p-4 md:p-5">
        <div className="flex min-w-0 flex-col items-start gap-[10px]">
          <Chip tone="white">{label}</Chip>
          <div className="flex flex-col items-start gap-[4px]">
            <h3 className="t-h5">{title}</h3>
            {line && <p className="t-base text-muted">{line}</p>}
          </div>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink transition-transform duration-300 group-hover:translate-x-1">
          <img src={img.arrow} alt="" className="h-2 w-3 invert" loading="lazy" decoding="async" />
        </span>
      </div>
    </Link>
  );
}

const tone = {
  blue: { card: "bg-[linear-gradient(135deg,#406ae4_0%,#5290f4_100%)]", chip: "bg-white/15 text-white", title: "!text-white", text: "text-white/80", icon: "bg-black", arrow: "bg-white", arrowImg: "" },
  dark: { card: "icon-dark", chip: "bg-white/10 text-white", title: "!text-white", text: "text-gray-text", icon: "bg-white", arrow: "bg-white", arrowImg: "" },
  surface: { card: "bg-surface", chip: "bg-white text-muted", title: "", text: "text-muted", icon: "icon-dark", arrow: "bg-ink", arrowImg: "invert" },
  white: { card: "bg-white ring-1 ring-hairline", chip: "bg-surface text-muted", title: "", text: "text-muted", icon: "icon-dark", arrow: "bg-ink", arrowImg: "invert" },
};

type Tone = keyof typeof tone;

function Tile({ s, icon, t, className = "" }: { s: Service; icon: string; t: Tone; className?: string }) {
  const c = tone[t];
  return (
    <Link href={`/services/${s.slug}`} className={`group flex h-full flex-col justify-between gap-5 overflow-hidden rounded-[10px] p-5 md:rounded-[30px] md:p-[30px] ${c.card} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`inline-flex h-7 items-center rounded-full px-[14px] pb-[6px] pt-1 text-[14px] font-medium leading-[18.2px] ${c.chip}`}>{s.label}</span>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${c.icon}`}>
          <img src={icon} alt="" className={`size-5 object-contain ${t === "dark" ? "invert" : ""}`} loading="lazy" decoding="async" />
        </span>
      </div>
      <Artwork s={s} pad="p-3" className="aspect-[16/9] w-full overflow-clip rounded-[10px] bg-white md:rounded-[16px]" />
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[6px]">
          <h3 className={`t-h4 ${c.title}`}>{s.title}</h3>
          <p className={`t-body ${c.text}`}>{s.line}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${c.arrow}`}>
          <img src={img.arrow} alt="" className={`h-2 w-3 ${c.arrowImg}`} loading="lazy" decoding="async" />
        </span>
      </div>
    </Link>
  );
}

export async function Services({ services }: { services: Service[] }) {
  const [counselling, visa, scholarship, ielts] = services;
  const t = await loadText();
  return (
    <section id="services" className="py-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="flex flex-col items-start gap-[30px] md:gap-[50px]">
          <div className="flex w-full flex-col gap-[10px] md:flex-row md:items-end md:gap-[30px] lg:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">{t("home.services.badge", "Our services")}</Badge>
              <h2 className="t-h2">{t("home.services.title", "Get the right help")}</h2>
            </Appear>
            <Appear delay={0.1} className="flex flex-1 flex-col items-start gap-4 md:items-end md:gap-5">
              <p className="t-body text-muted md:text-right">{t("home.services.lead", "Education counselling, visa guidance, scholarship guidance and IELTS coaching.")}</p>
              <PillButton href="/services" tone="dark">
                {t("home.services.cta", "View all services")}
              </PillButton>
            </Appear>
          </div>

          <div className="grid w-full min-w-0 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-[30px]">
            <Appear className="min-w-0 lg:col-span-7"><Tile s={counselling} icon={img.statIcons[0]} t="blue" /></Appear>
            <Appear delay={0.1} className="min-w-0 lg:col-span-5"><Tile s={visa} icon={img.statIcons[3]} t="dark" /></Appear>
            <Appear delay={0.2} className="min-w-0 lg:col-span-5"><Tile s={scholarship} icon={img.statIcons[2]} t="surface" /></Appear>
            <Appear delay={0.3} className="min-w-0 lg:col-span-7"><Tile s={ielts} icon={img.overviewIcons[1]} t="white" /></Appear>
          </div>
        </div>
      </div>
    </section>
  );
}
