import type { Metadata } from "next";
import { gl, img } from "@/lib/assets";
import { offices } from "@/lib/site";
import { about } from "@/content/about";
import { team } from "@/content/team";
import { googleRating } from "@/content/stories";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg } from "@/components/ui/bits";
import { InnerHero, SectionHead, StatCard, TeamCard } from "@/components/inner";
import { Partners } from "@/components/home/partners";
import { TabShoulders } from "@/components/home/steps";

export const metadata: Metadata = { title: "About us", description: about.established };

const stats = [
  ["Established", "2022", "Education and migration guidance since 2022.", 0],
  ["Offices worldwide", String(offices.length), "Melbourne, Butwal and Cebu.", 2],
  ["Team members", String(team.length), "Counsellors, migration and admission staff.", 3],
  ["Partner institutions", "100+", "Colleges, institutions, universities and TAFE facilities we represent.", 0],
  ["Google rating", googleRating.score, `Based on ${googleRating.count} client reviews.`, 2],
  ["Languages", "5+", "Certified counsellors who speak your language.", 3],
] as const;

export default function AboutPage() {
  return (
    <>
      <InnerHero badge="About Goodluck" title="About Goodluck Education & Migration" lead={about.established} bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" after={
        <Appear delay={0.1} className="w-full">
          <div className="aspect-[16/9] w-full overflow-clip rounded-[10px] md:rounded-[30px]">
            <img src={gl.teamPhoto} alt="The Goodluck team together" className="size-full object-cover" loading="lazy" decoding="async" />
          </div>
        </Appear>
      } />

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid gap-[50px] md:grid-cols-2">
            <Appear className="flex flex-col items-start gap-[10px] md:gap-5">
              <h2 className="t-h3">Our mission</h2>
              <p className="t-body text-muted">{about.mission}</p>
              <h2 className="t-h3 pt-[10px]">Our vision</h2>
              <p className="t-body text-muted">{about.vision}</p>
              <PillButton href="/about/team" tone="dark">Meet the team</PillButton>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start gap-[10px] md:gap-5">
              <h2 className="t-h3">Our values and ethics</h2>
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
              <h2 className="t-h2 relative z-[3] text-center">Message from co-founders</h2>
            </div>
            <div className="relative w-full overflow-clip rounded-[10px] p-[6px] ring-1 ring-inset ring-hairline md:rounded-[30px]">
              <div className="grid overflow-clip rounded-[6px] bg-surface md:grid-cols-[0.9fr_1.1fr] md:rounded-[24px]">
                <div className="relative min-h-[320px] md:min-h-0">
                  <img src={gl.founders} alt="Bimal Gurung and Kishor Gharti Magar" className="absolute inset-0 size-full object-cover object-[40%_20%]" loading="lazy" decoding="async" />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_55%,rgba(0,0,0,0.55)_100%)]" />
                  <div className="absolute inset-x-5 bottom-5 flex flex-col gap-[2px]">
                    <p className="text-[18px] font-semibold leading-[23.4px] text-white md:text-[20px] md:leading-[26px]">{about.founders}</p>
                    <p className="t-small text-white/80">Co-founders</p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-5 p-5 md:gap-[30px] md:p-[30px] lg:p-[50px]">
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="t-h4">Our journey</h3>
                    <p className="t-body text-muted">A note from the co-founders</p>
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
                  <PillButton href="/about/message-from-co-founders" tone="dark">Read the full message</PillButton>
                </div>
              </div>
            </div>
          </Appear>
        </div>
      </section>

      <Partners tone="dark" className="pt-[60px] md:pt-20 lg:pt-[100px]" />

      <section className="py-section relative flex w-full flex-col items-center">
        <SectionBg src={img.testimonialBg} top bottom />
        <div className="container-x relative z-[1]">
          <div className="grid gap-5 md:grid-cols-3 md:gap-[30px] lg:grid-cols-4">
            <Appear className="flex flex-col items-start gap-[10px] md:col-span-3 lg:col-span-2 lg:gap-5">
              <h2 className="t-h2">Goodluck in numbers</h2>
              <p className="t-body text-muted">{about.vision}</p>
              <PillButton href="/services">Explore our services</PillButton>
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
            <SectionHead badge="Expert team members" title="Our team at your service" />
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[30px] md:gap-y-10 lg:grid-cols-5">
              {team.slice(0, 5).map((m, i) => (
                <div key={m.slug} className={i === 4 ? "col-span-2 md:col-span-1" : ""}>
                  <TeamCard name={m.name} role={m.role} photo={m.photo} delay={0.08 * i} />
                </div>
              ))}
            </div>
            <Appear><PillButton href="/about/team" tone="dark">Meet the whole team</PillButton></Appear>
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-clip rounded-[10px] bg-surface p-5 md:flex-row md:gap-[30px] md:rounded-[30px] md:p-[30px] lg:gap-10 lg:p-10">
            <h2 className="t-h4 text-center md:max-w-[324px] md:text-left lg:max-w-[302px]">Global offices in Australia, Philippines and Nepal</h2>
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
