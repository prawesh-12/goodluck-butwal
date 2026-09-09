import type { Metadata } from "next";
import { buildEntityMetadata } from "@/lib/seo";
import { gl, img } from "@/config/assets";
import { offices } from "@/config/site";
import { getAboutContent } from "@/features/pages/queries";
import { listTeam } from "@/features/team/queries";
import { listPartnerLogos } from "@/features/partners/queries";
import { getGoogleRating } from "@/features/settings/queries";
import { loadText } from "@/features/site-text/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg } from "@/components/ui/bits";
import { VideoDialog } from "@/components/ui/video-dialog";
import { InnerHero, SectionHead, StatCard, TeamCard } from "@/components/shared/inner";
import { Partners } from "@/features/partners/components/partners";
import { TabShoulders } from "@/components/shared/steps";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutContent();
  return buildEntityMetadata("page", "about", {
    path: "/about",
    title: "About us",
    description: about.established,
  });
}



export default async function AboutPage() {
  const [team, logos, about, googleRating, t] = await Promise.all([
    listTeam(),
    listPartnerLogos(),
    getAboutContent(),
    getGoogleRating(),
    loadText(),
  ]);

  const stats = [
    [t("about.stats.established.label", "Established"), t("about.stats.established.value", "2022"), t("about.stats.established.text", "Education and migration guidance since 2022."), 0],
    [t("about.stats.offices.label", "Offices worldwide"), String(offices.length), t("about.stats.offices.text", "Melbourne, Butwal and Cebu."), 2],
    [t("about.stats.team.label", "Team members"), String(team.length), t("about.stats.team.text", "Counsellors, migration and admission staff."), 3],
    [t("about.stats.partners.label", "Partner institutions"), t("about.stats.partners.value", "100+"), t("about.stats.partners.text", "Colleges, institutions, universities and TAFE facilities we represent."), 0],
    [t("about.stats.rating.label", "Google rating"), googleRating.score, t("about.stats.rating.text", "Based on {count} client reviews.").replace("{count}", String(googleRating.count)), 2],
    [t("about.stats.languages.label", "Languages"), t("about.stats.languages.value", "5+"), t("about.stats.languages.text", "Certified counsellors who speak your language."), 3],
  ] as const;

  return (
    <>
      <InnerHero badge={t("about.hero.badge", "About Goodluck")} title={t("about.hero.title", "About Goodluck Education & Migration")} lead={about.established} bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" after={
        <Appear delay={0.1} className="w-full">
          <VideoDialog src={gl.film} poster={gl.filmPoster} title={t("about.video.title", "Inside Goodluck Education and Migration")} className="group aspect-[16/9] w-full overflow-clip rounded-[10px] md:rounded-[30px]" />
        </Appear>
      } />

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid gap-[50px] md:grid-cols-2">
            <Appear className="flex flex-col items-start gap-[10px] md:gap-5">
              <h2 className="t-h3">{t("about.mission.title", "Our mission")}</h2>
              <p className="t-body text-muted">{about.mission}</p>
              <h2 className="t-h3 pt-[10px]">{t("about.vision.title", "Our vision")}</h2>
              <p className="t-body text-muted">{about.vision}</p>
              <PillButton href="/about/team" tone="dark">{t("about.mission.cta", "Meet the team")}</PillButton>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start gap-[10px] md:gap-5">
              <h2 className="t-h3">{t("about.values.title", "Our values and ethics")}</h2>
              <p className="t-body text-muted">{about.values}</p>
              <div className="flex flex-col items-start gap-[10px] md:gap-5">
                {about.ethics.map((text, i) => (
                  <div key={text} className="flex items-start gap-4">
                    <span className="icon-dark flex size-10 shrink-0 items-center justify-center overflow-clip rounded-[10px] ring-1 ring-inset ring-white/10">
                      <img src={img.overviewIcons[i % 3]} alt="" className="h-5" loading="lazy" decoding="async" />
                    </span>
                    <p className="t-body max-w-[500px] pt-2 text-muted">{text}</p>
                  </div>
                ))}
              </div>
            </Appear>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <Appear className="flex w-full flex-col items-center">
            <div className="relative flex items-center justify-center gap-[10px] p-4 md:pb-[10px] lg:pb-[50px]">
              <div className="hidden md:contents"><TabShoulders width={515} /></div>
              <h2 className="t-h2 relative z-[3] text-center">{t("about.founders.title", "Message from co-founders")}</h2>
            </div>
            <div className="relative w-full overflow-clip rounded-[10px] p-[6px] ring-1 ring-inset ring-hairline md:rounded-[30px]">
              <div className="grid overflow-clip rounded-[6px] bg-surface md:grid-cols-[0.9fr_1.1fr] md:rounded-[24px]">
                <div className="relative min-h-[320px] md:min-h-0">
                  <img src={gl.founders} alt="Bimal Gurung and Kishor Gharti Magar" className="absolute inset-0 size-full object-cover object-[40%_20%]" loading="lazy" decoding="async" />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_55%,rgba(0,0,0,0.55)_100%)]" />
                  <div className="absolute inset-x-5 bottom-5 flex flex-col gap-[2px]">
                    <p className="text-[18px] font-semibold leading-[23.4px] text-white md:text-[20px] md:leading-[26px]">{about.founders}</p>
                    <p className="t-small text-white/80">{t("about.founders.role", "Co-founders")}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-5 p-5 md:gap-[30px] md:p-[30px] lg:p-[50px]">
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="t-h4">{t("about.journey.title", "Our journey")}</h3>
                    <p className="t-body text-muted">{t("about.journey.lead", "A note from the co-founders")}</p>
                  </div>
                  <div className="flex flex-col items-start gap-[10px] md:gap-4">
                    {about.coFounderSummary.map((t) => (
                      <p key={t.slice(0, 40)} className="t-body text-muted">{t}</p>
                    ))}
                  </div>
                  <blockquote className="flex flex-col gap-2 rounded-[10px] bg-white p-5 md:rounded-[20px]">
                    <p className="t-body text-ink">&ldquo;{about.founderQuote}&rdquo;</p>
                    <p className="t-small text-muted">{about.founders}</p>
                  </blockquote>
                  <PillButton href="/about/message-from-co-founders" tone="dark">{t("about.founders.cta", "Read the full message")}</PillButton>
                </div>
              </div>
            </div>
          </Appear>
        </div>
      </section>

      <Partners logos={logos} tone="dark" className="pt-[60px] md:pt-20 lg:pt-[100px]" />

      <section className="py-section relative flex w-full flex-col items-center">
        <SectionBg src={img.testimonialBg} top bottom />
        <div className="container-x relative z-[1]">
          <div className="grid gap-5 md:grid-cols-3 md:gap-[30px] lg:grid-cols-4">
            <Appear className="flex flex-col items-start gap-[10px] md:col-span-3 lg:col-span-2 lg:gap-5">
              <h2 className="t-h2">{t("about.numbers.title", "Goodluck in numbers")}</h2>
              <p className="t-body text-muted">{about.vision}</p>
              <PillButton href="/services">{t("about.numbers.cta", "Explore our services")}</PillButton>
            </Appear>
            {stats.map(([label, value, text, icon], i) => (
              <Appear key={label} delay={0.1 * (i % 3)}>
                <StatCard label={label} value={value} text={text} icon={img.statIcons[icon]} className="md:h-[250px]" />
              </Appear>
            ))}
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col items-center pb-[100px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("about.team.badge", "Expert team members")} title={t("about.team.title", "Our team at your service")} />
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[30px] md:gap-y-10 lg:grid-cols-5">
              {team.slice(0, 5).map((m, i) => (
                <div key={m.slug} className={i === 4 ? "col-span-2 md:col-span-1" : ""}>
                  <TeamCard name={m.name} role={m.role} photo={m.photo} delay={0.08 * i} href={`/team/${m.slug}`} />
                </div>
              ))}
            </div>
            <Appear><PillButton href="/about/team" tone="dark">{t("about.team.cta", "Meet the whole team")}</PillButton></Appear>
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-clip rounded-[10px] bg-surface p-5 md:flex-row md:gap-[30px] md:rounded-[30px] md:p-[30px] lg:gap-10 lg:p-10">
            <h2 className="t-h4 text-center md:max-w-[324px] md:text-left lg:max-w-[302px]">{t("about.offices.title", "Global offices in Australia, Philippines and Nepal")}</h2>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-[10px]">
              {offices.map((o) => (
                <Badge key={o.id} tone="white" className="ring-1 ring-hairline">{o.city}, {o.country}</Badge>
              ))}
            </div>
          </Appear>
        </div>
      </section>
    </>
  );
}
