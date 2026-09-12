import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { notFound } from "next/navigation";
import { getDestination, listDestinations } from "@/features/destinations/queries";
import { listAllFaqs } from "@/features/services/queries";
import { listArticles } from "@/features/posts/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, CheckRow, Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, NewsCard, SectionHead } from "@/components/shared/inner";
import { Accordion, FaqCta } from "@/components/shared/faqs";
import { listTeam } from "@/features/team/queries";
import { listInstitutions } from "@/features/institutions/queries";
import { InstitutionCard } from "@/features/institutions/components/institution-card";
import { loadText } from "@/features/site-text/queries";
import { CARD_SIZES, Img } from "@/components/ui/img";

type Props = { params: Promise<{ destination: string }> };
export const generateStaticParams = async () =>
  (await listDestinations()).filter((d) => d.hasPage).map((d) => ({ destination: d.slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { destination } = await params;
  const d = await getDestination(destination);
  if (!d) return buildMetadata({ path: "/study-abroad", title: "Destinations", noindex: true });
  return buildMetadata({
    path: `/study-abroad/${destination}`,
    title: `Study in ${d.name}`,
    description: d.overview,
  });
}

// The fallback matches plain text, not a regex: the name is admin input and would need escaping.
const keyword: Record<string, RegExp> = { australia: /australia/i, "united-kingdom": /\bUK\b|United Kingdom/i };

function mentions(title: string, slug: string, name: string) {
  const pattern = keyword[slug];
  return pattern ? pattern.test(title) : title.toLowerCase().includes(name.toLowerCase());
}

export default async function DestinationPage({ params }: Props) {
  const [faces, allFaqs, t] = await Promise.all([
    listTeam().then((team) => team.slice(0, 3)),
    listAllFaqs(),
    loadText(),
  ]);

  const { destination } = await params;
  const d = await getDestination(destination);
  if (!d) notFound();
  const articles = await listArticles();
  const news = articles.filter((a) => mentions(a.title, d.slug, d.name)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const relevantInstitutions = (await listInstitutions()).filter((i) => i.destinationSlug === d.slug).slice(0, 6);

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Destinations", path: "/study-abroad" }, { name: d.name, path: `/study-abroad/${d.slug}` }])} />
      <InnerHero bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" title={`${t("study.destination.hero.title_prefix", "Study in")} ${d.name}`} lead={d.overview} badge={undefined} className="[&_h1]:order-2 [&_p]:order-3" after={
        <Appear delay={0.1} className="w-full">
          <div className="aspect-[16/9] w-full overflow-clip rounded-[10px] md:rounded-[30px]">
            <Img src={d.hero} alt={d.heroAlt} sizes="100vw" w={1280} className="size-full object-cover" fetchPriority="high" decoding="async" />
          </div>
        </Appear>
      }>
        <div className="order-1 flex items-center gap-[10px]">
          <span className="flex size-[38px] items-center justify-center rounded-full bg-white ring-1 ring-hairline"><Img src={d.flag} alt="" w={48} className="size-5 rounded-full" loading="lazy" decoding="async" /></span>
          <Chip tone="white">{t("study.destination.hero.chip", "Study abroad")}</Chip>
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
            {[[t("study.destination.academic.badge", "Education"), t("study.destination.academic.title", "Academic period"), d.academic], [t("study.destination.work.badge", "Work"), t("study.destination.work.title", "Work while you study"), d.work]].map(([badge, title, text], i) => (
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
            <SectionHead badge={t("study.destination.migration.badge", "Migration")} title={d.migrationTitle} lead={t("study.destination.migration.note", "Indicative only. Confirm current visa details with a Goodluck counsellor.")} />
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
                <Img src={d.card} alt={d.name} sizes={CARD_SIZES} className="size-full object-cover" loading="lazy" decoding="async" />
              </div>
            </Appear>
            <Appear delay={0.1} className="order-1 flex flex-1 flex-col items-start gap-5 md:order-2 md:gap-10">
              <div className="flex flex-col items-start gap-[10px]">
                <Badge className="ring-1 ring-hairline">{t("study.destination.why.badge_prefix", "Why")} {d.name}</Badge>
                <h2 className="t-h2">{d.whyTitle}</h2>
                <PillButton href="/contact/book-consultation" tone="dark">{t("study.destination.why.cta", "Book a consultation")}</PillButton>
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
              <h2 className="t-h3">{d.costs ? t("study.destination.costs.title", "Estimated costs") : t("study.destination.help_card.title", "How we help")}</h2>
              <div className="flex flex-col items-start gap-4">
                {(d.costs ?? d.help).map((c) => (
                  <div key={c.title} className="flex flex-col gap-[2px]">
                    <p className="t-body text-ink">{c.title}</p>
                    <p className="t-base text-muted">{c.line}</p>
                  </div>
                ))}
                {d.costs && <p className="t-small text-muted">{t("study.destination.costs.note", "Indicative only. Confirm current figures with a Goodluck counsellor.")}</p>}
              </div>
            </Appear>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("study.destination.help.badge", "How we help")} title={t("study.destination.help.title", "From free consultation to visa")} />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px]">
              {d.help.map((h, i) => (
                <InfoCard key={h.title} label={`0${i + 1}`} title={h.title} line={h.line} tone={i === 0 ? "dark" : "surface"} delay={0.1 * i} className="min-h-[200px] justify-between" />
              ))}
            </div>
            <Appear><PillButton href="/contact/book-consultation">{t("study.destination.help.cta", "Book a free consultation")}</PillButton></Appear>
          </div>
        </div>
      </section>

      {relevantInstitutions.length > 0 && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead align="left" badge={t("study.destination.institutions.badge", "Institutions")} title={`${t("study.destination.institutions.title_prefix", "Relevant institutions in")} ${d.name}`} />
              <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
                {relevantInstitutions.map((i, n) => <InstitutionCard key={i.slug} institution={i} delay={0.05 * n} />)}
              </div>
              <Appear><PillButton href="/institutions" tone="dark">{t("study.destination.institutions.cta", "See all institutions")}</PillButton></Appear>
            </div>
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead align="left" badge={t("study.destination.news.badge", "News")} title={`${t("study.destination.news.title_prefix", "Latest on")} ${d.name}`} />
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
                <h2 className="t-h2">{t("study.destination.faq.title", "Frequently asked questions")}</h2>
                <p className="t-body text-muted">{t("study.destination.faq.lead", "Common questions about programmes, scholarships and visas.")}</p>
              </div>
              <FaqCta faces={faces} className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={allFaqs} />
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
