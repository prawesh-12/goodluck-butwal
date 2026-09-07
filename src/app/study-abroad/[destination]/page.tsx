import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { destinationBySlug, destinations } from "@/content/destinations";
import { faqs } from "@/content/faqs";
import articles from "@/content/articles.json";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, CheckRow, Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, NewsCard, SectionHead } from "@/components/inner";
import { Accordion, FaqCta } from "@/components/home/faqs";

type Props = { params: Promise<{ destination: string }> };
export const generateStaticParams = () => destinations.map((d) => ({ destination: d.slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = destinationBySlug((await params).destination);
  return d ? { title: `Study in ${d.name}`, description: d.overview } : { title: "Study abroad" };
}

const keyword: Record<string, RegExp> = { australia: /australia/i, "united-kingdom": /\bUK\b|United Kingdom/i };

export default async function DestinationPage({ params }: Props) {
  const { destination } = await params;
  const d = destinationBySlug(destination);
  if (!d) notFound();
  const news = articles.filter((a) => keyword[d.slug].test(a.title)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <>
      <InnerHero bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" title={`Study in ${d.name}`} lead={d.overview} badge={undefined} className="[&_h1]:order-2 [&_p]:order-3" after={
        <Appear delay={0.1} className="w-full">
          <div className="aspect-[16/9] w-full overflow-clip rounded-[10px] md:rounded-[30px]">
            <img src={d.hero} alt={d.heroAlt} className="size-full object-cover" />
          </div>
        </Appear>
      }>
        <div className="order-1 flex items-center gap-[10px]">
          <span className="flex size-[38px] items-center justify-center rounded-full bg-white ring-1 ring-hairline"><img src={d.flag} alt="" className="size-5 rounded-full" /></span>
          <Chip tone="white">Study abroad</Chip>
        </div>
      </InnerHero>

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid gap-5 md:grid-cols-3 md:gap-[30px]">
            {d.highlights.map((h, i) => (
              <InfoCard key={h.title} label={`0${i + 1}`} title={h.title} line={h.line} tone={i === 1 ? "dark" : "surface"} delay={0.1 * i} className="min-h-[220px] justify-between" />
            ))}
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid gap-5 md:grid-cols-2 md:gap-[30px]">
            {[["Education", "Academic period", d.academic], ["Work", "Work while you study", d.work]].map(([badge, title, text], i) => (
              <Appear key={title} delay={0.1 * i} className="flex flex-col items-start gap-5 overflow-hidden rounded-[10px] bg-surface p-5 md:rounded-[30px] md:p-10">
                <Badge tone="white" className="ring-1 ring-hairline">{badge}</Badge>
                <div className="flex flex-col items-start gap-[10px]">
                  <h2 className="t-h3">{title}</h2>
                  <p className="t-body text-muted">{text}</p>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge="Migration" title={d.migrationTitle} lead="Indicative only. Confirm current visa details with a Goodluck counsellor." />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px]">
              {d.migration.map((m, i) => (
                <InfoCard key={m.title} title={m.title} line={m.line} tone={i === 0 ? "blue" : "surface"} delay={0.1 * i} className="min-h-[200px] justify-between" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="order-2 flex w-full flex-col items-start gap-10 overflow-clip rounded-[10px] bg-surface p-5 md:order-1 md:w-[517px] md:rounded-[30px] lg:w-[628px] lg:px-[60px] lg:py-[30px]">
              <div className="aspect-[1.27586] w-full overflow-clip rounded-[20px]">
                <img src={d.card} alt={d.name} className="size-full object-cover" />
              </div>
            </Appear>
            <Appear delay={0.1} className="order-1 flex flex-1 flex-col items-start gap-5 md:order-2 md:gap-10">
              <div className="flex flex-col items-start gap-[10px]">
                <Badge className="ring-1 ring-hairline">Why {d.name}</Badge>
                <h2 className="t-h2">{d.whyTitle}</h2>
                <PillButton href="/contact/book-consultation" tone="dark">Book a consultation</PillButton>
              </div>
              <div className="flex flex-col items-start gap-[10px]">
                {d.why.map((w) => <CheckRow key={w}>{w}</CheckRow>)}
              </div>
            </Appear>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid gap-5 md:grid-cols-2 md:gap-[30px]">
            <Appear className="flex flex-col items-start gap-5 overflow-hidden rounded-[10px] bg-surface p-5 md:rounded-[30px] md:p-10">
              <h2 className="t-h3">{d.checklistTitle}</h2>
              <div className="flex flex-wrap gap-[10px]">
                {d.checklist?.map((c) => <Chip key={c} tone="white" wrap>{c}</Chip>)}
              </div>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start gap-5 overflow-hidden rounded-[10px] bg-surface p-5 md:rounded-[30px] md:p-10">
              <h2 className="t-h3">{d.costs ? "Estimated costs" : "How we help"}</h2>
              <div className="flex flex-col items-start gap-4">
                {(d.costs ?? d.help).map((c) => (
                  <div key={c.title} className="flex flex-col gap-[2px]">
                    <p className="t-body text-ink">{c.title}</p>
                    <p className="t-base text-muted">{c.line}</p>
                  </div>
                ))}
                {d.costs && <p className="t-small text-muted">Indicative only. Confirm current figures with a Goodluck counsellor.</p>}
              </div>
            </Appear>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge="How we help" title="From free consultation to visa" />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px]">
              {d.help.map((h, i) => (
                <InfoCard key={h.title} label={`0${i + 1}`} title={h.title} line={h.line} tone={i === 0 ? "dark" : "surface"} delay={0.1 * i} className="min-h-[200px] justify-between" />
              ))}
            </div>
            <Appear><PillButton href="/contact/book-consultation">Book a free consultation</PillButton></Appear>
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead align="left" badge="News" title={`Latest on ${d.name}`} />
              <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
                {news.map((a, i) => <NewsCard key={a.slug} article={a} delay={0.05 * i} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">Frequently asked questions</h2>
                <p className="t-body text-muted">Common questions about programmes, scholarships and visas.</p>
              </div>
              <FaqCta className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={[...faqs.education, ...faqs.migration]} />
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
