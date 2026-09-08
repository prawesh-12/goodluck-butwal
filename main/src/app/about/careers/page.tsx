import type { Metadata } from "next";
import { buildEntityMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/components/seo/schema";
import { img } from "@/lib/assets";
import { company } from "@/lib/site";
import { getAboutContent } from "@/server/queries/pages";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { SectionBg } from "@/components/ui/bits";
import { InfoCard, InnerHero, SectionHead } from "@/components/inner";
import { loadText } from "@/server/queries/text";

export async function generateMetadata(): Promise<Metadata> {
  return buildEntityMetadata("page", "careers", { path: "/about/careers", title: "Careers" });
}
const tones = ["surface", "dark", "blue", "surface"] as const;

export default async function CareersPage() {
  const t = await loadText();
  const about = await getAboutContent();

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "About us", path: "/about" }, { name: "Careers", path: "/about/careers" }])} />
      <InnerHero badge={t("about.careers.badge", "Careers")} title={t("about.careers.title", "Climb your career ladder with Goodluck")} lead={t("about.careers.lead", "We hold your efforts in high regard.")} after={<Appear delay={0.1}><PillButton href={`mailto:${company.email}`}>Email {company.email}</PillButton></Appear>} />
      <section className="flex w-full flex-col items-center pb-[100px] md:pb-[160px] lg:pb-[200px]">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("about.careers.life.badge", "Working here")} title={t("about.careers.life.title", "Discover the excellence of Goodluck")} />
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-4">
              {about.careersValues.map((v, i) => (
                <InfoCard key={v.title} label={`0${i + 1}`} title={v.title} line={v.line} tone={tones[i]} delay={0.1 * i} className="min-h-[220px] justify-between md:min-h-[260px]" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-section relative flex w-full flex-col items-center">
        <SectionBg src={img.testimonialBg} top bottom />
        <div className="container-x relative z-[1]">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead title={t("about.careers.voices.title", "Time to tune in to what our crew has to spill")} />
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
              {about.staffVoices.map((s, i) => (
                <Appear key={s.name} delay={0.1 * (i % 2)} className="flex flex-col items-start justify-between gap-10 overflow-hidden rounded-[10px] bg-white p-5 md:rounded-[30px] md:p-10">
                  <p className="t-body text-ink">&ldquo;{s.quote}&rdquo;</p>
                  <div className="flex items-start gap-4">
                    <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-surface font-display text-[20px] font-semibold text-ink">{s.name[0]}</span>
                    <div className="flex flex-col justify-center gap-[2px]">
                      <p className="text-[18px] font-medium leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]">{s.name}</p>
                      <p className="t-small text-muted">{s.role}</p>
                    </div>
                  </div>
                </Appear>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
