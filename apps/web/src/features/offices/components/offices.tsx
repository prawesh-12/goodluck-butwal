import { gl } from "@/config/assets";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { loadText } from "@/features/site-text/queries";
import { Img } from "@/components/ui/img";

const flags = ["/images/flags/australia.svg", "/images/flags/new-zealand.svg", "/images/flags/united-kingdom.svg"];
const pathways = ["Entering & leaving from country", "Visas", "Country citizenship", "Settling in country", "Help & support"];

// A logo on its own filled plate fills the tile so the circle crops it round. Matched with or
// without an extension: the same logo is served from public/ by path and Cloudinary by id.
const filled = (src: string) => /partner-04(?:\.|$)/.test(src);

// Logos are spread evenly from the top so the ring never shows a gap. Sizes are in px inside a
// fixed box, or in % of the parent when the ring has to follow a phone's width.
function Orbit({ radius, icon, box, ring, unit = "px" }: { radius: number; icon: number; box: number; ring: string[]; unit?: "px" | "%" }) {
  const u = (n: number) => `${n}${unit}`;
  return (
    <div aria-hidden className={unit === "px" ? "absolute left-1/2 top-0 -translate-x-1/2" : "absolute inset-0"} style={unit === "px" ? { width: box, height: box } : undefined}>
      {/* Dashed track under the logos. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/15" style={{ width: u(radius * 2), height: u(radius * 2) }} />
      <div className="animate-orbit size-full">
        {ring.map((src, i) => {
          const rad = ((i * 360) / ring.length - 90) * (Math.PI / 180);
          const x = box / 2 + radius * Math.sin(rad) - icon / 2;
          const y = box / 2 - radius * Math.cos(rad) - icon / 2;
          return (
            <span key={src} className={`animate-orbit-back absolute flex items-center justify-center overflow-clip rounded-full bg-white shadow-[0_8px_20px_-8px_rgba(29,29,29,0.25)] ring-1 ring-hairline ${filled(src) || unit === "%" ? "" : "p-3"}`} style={{ left: u(x), top: u(y), width: u(icon), height: u(icon) }}>
              <Img src={src} alt="" w={160} className={filled(src) ? "size-full object-cover" : unit === "px" ? "size-full object-contain" : "size-[64%] object-contain"} loading="lazy" decoding="async" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export async function Offices({ logos }: { logos: string[] }) {
  const t = await loadText();
  const ring = logos.slice(0, 16);
  return (
    <section id="visas" className="pb-section flex w-full flex-col items-center">
      <div className="container-x">
        <Appear className="relative flex w-full flex-col items-center gap-[30px] overflow-clip rounded-[10px] bg-surface p-5 md:gap-[50px] md:rounded-[30px] md:p-[50px] lg:p-[100px]">
          <div className="icon-dark relative z-[2] grid w-full items-center gap-[30px] overflow-clip rounded-[10px] p-5 md:grid-cols-[1.1fr_1fr] md:rounded-[20px] md:p-10 lg:p-[60px]">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
            <div aria-hidden className="pointer-events-none absolute -right-[6%] top-[10%] size-[560px] rounded-full bg-blue/40 blur-[140px]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-[40%] left-[10%] size-[420px] rounded-full bg-white/10 blur-[120px]" />
            <div className="relative flex flex-col items-start gap-5 md:gap-[30px]">
              <div className="flex flex-col items-start gap-[10px]">
                <Badge tone="white" className="ring-1 ring-hairline">{t("home.offices.badge", "Migration")}</Badge>
                <h2 className="t-h2 !text-white">{t("home.offices.title", "Fly your dream destination")}</h2>
                <p className="t-body text-gray-text">{t("home.offices.lead", "Apply for your visa now!")}</p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {pathways.map((pathway, i) => (
                  <p key={pathway} className="flex items-center gap-[10px] rounded-full bg-white/[0.08] py-[9px] pl-3 pr-4 text-[15px] font-medium leading-[18px] text-white ring-1 ring-inset ring-white/10">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green/25">
                      <svg aria-hidden viewBox="0 0 12 10" className="h-[8px] w-[10px]">
                        <path d="M1 5l3.5 3.5L11 1.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {t(`home.offices.pathway.${i + 1}`, pathway)}
                  </p>
                ))}
              </div>
              <PillButton href="/contact/book-consultation">{t("home.offices.cta", "Book a consultation")}</PillButton>
            </div>
            <div className="relative flex flex-col items-center gap-4 md:items-end">
              <Img src={gl.plane} alt="" w={640} className="animate-float w-[82%] max-w-[520px] object-contain md:w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" loading="lazy" decoding="async" />
              <p className="flex max-w-full items-center gap-[10px] rounded-full bg-white/10 py-[6px] pl-[6px] pr-4 text-[14px] font-medium text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur-[6px]">
                <span className="flex shrink-0 items-center">
                  {flags.map((f, i) => (
                    <Img key={f} src={f} alt="" w={64} className={`size-[26px] rounded-full ring-2 ring-[#1a1a1a] ${i ? "-ml-2" : ""}`} loading="lazy" decoding="async" />
                  ))}
                </span>
                <span className="min-w-0">{t("home.offices.destinations", "Australia, New Zealand and the UK")}</span>
              </p>
            </div>
          </div>
          <div className="relative z-0 flex w-full flex-col items-center gap-[30px] md:hidden">
            {/* Eight logos on a ring that follows the phone's width, so none is cut at the sides. */}
            <div className="relative aspect-square w-full max-w-[340px]">
              <Orbit radius={40} icon={18} box={100} unit="%" ring={ring.filter((_, i) => i % 2 === 0)} />
              <span className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(29,29,29,0.18)]">
                <span aria-hidden className="absolute -inset-4 rounded-full ring-1 ring-ink/10" />
                <span aria-hidden className="absolute -inset-8 rounded-full ring-1 ring-ink/[0.06]" />
                <Img src={gl.mark} alt="" w={160} className="size-[55%] object-contain" loading="lazy" decoding="async" />
              </span>
            </div>
            <h3 className="t-h4 max-w-[300px] text-center">
              {t("home.offices.claim.before", "Official representative of")} <span className="text-blue-deep">{t("home.offices.claim.count", "100+")}</span> {t("home.offices.claim.after", "colleges, universities and TAFE facilities")}
            </h3>
          </div>
          <Img aria-hidden src={gl.campus} alt="" sizes="100vw" className="pointer-events-none -mx-5 -mb-5 w-[calc(100%+40px)] max-w-none object-contain md:hidden" loading="lazy" decoding="async" />
          <div className="relative z-0 hidden h-[350px] w-full max-w-[1000px] flex-col items-center justify-center overflow-clip py-[50px] md:flex md:h-[400px] md:py-[120px] lg:h-[505px]">
            <Orbit radius={430} icon={80} box={940} ring={ring} />
            <div className="relative mt-[40px] flex max-w-[520px] flex-col items-center gap-[10px] md:mt-[110px] md:gap-5 lg:gap-[30px]">
              <span className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(29,29,29,0.18)] md:size-[100px] lg:size-[130px]">
                <span aria-hidden className="absolute -inset-4 rounded-full ring-1 ring-ink/10 md:-inset-6" />
                <span aria-hidden className="absolute -inset-8 rounded-full ring-1 ring-ink/[0.06] md:-inset-12" />
                <Img src={gl.mark} alt="" w={160} className="size-[55%] object-contain" loading="lazy" decoding="async" />
              </span>
              <h3 className="t-h4 max-w-[218px] text-center md:max-w-none">
                {t("home.offices.claim.before", "Official representative of")} <span className="text-blue-deep">{t("home.offices.claim.count", "100+")}</span> {t("home.offices.claim.after", "colleges, universities and TAFE facilities")}
              </h3>
            </div>
          </div>
          <Img aria-hidden src={gl.campus} alt="" sizes="100vw" className="pointer-events-none absolute -left-[10px] -right-[10px] bottom-0 z-[1] hidden w-[calc(100%+20px)] max-w-none object-contain object-bottom md:block" loading="lazy" decoding="async" />
        </Appear>
      </div>
    </section>
  );
}
