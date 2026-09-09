import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { notFound } from "next/navigation";
import { getService, listServices } from "@/features/services/queries";
import { listServiceFaqs } from "@/features/services/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, SectionHead } from "@/components/shared/inner";
import { Artwork, ServiceCard } from "@/features/services/components/services";
import { Accordion, FaqCta } from "@/components/shared/faqs";
import { listTeam } from "@/features/team/queries";
import { loadText } from "@/features/site-text/queries";

type Props = { params: Promise<{ slug: string }> };
export const generateStaticParams = async () => (await listServices()).map((s) => ({ slug: s.slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return buildMetadata({ path: "/services", title: "Service", noindex: true });
  return buildEntityMetadata("service", slug, {
    path: `/services/${slug}`,
    title: s.title,
    description: s.intro,
  });
}

export default async function ServicePage({ params }: Props) {
  const [faces, t] = await Promise.all([listTeam().then((team) => team.slice(0, 3)), loadText()]);

  const { slug } = await params;
  const s = await getService(slug);
  if (!s) notFound();
  const related = await listServiceFaqs(s.slug === "visa-guidance" ? "visa-guidance" : "education-counselling");
  const others = (await listServices()).filter((o) => o.slug !== s.slug);

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Our services", path: "/services" }, { name: s.title, path: `/services/${s.slug}` }])} />
      <InnerHero badge={s.label} badgeTone="chip-white" title={s.title} lead={s.intro} bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" after={
        <Appear delay={0.1} className="group w-full">
          <Artwork s={s} pad="p-6 md:p-10" className="mx-auto aspect-video w-full max-w-[760px] overflow-clip rounded-[10px] bg-white ring-1 ring-hairline md:rounded-[24px]" />
        </Appear>
      } />

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("services.detail.steps.badge", "How it works")} title={s.stepsTitle} />
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
              {s.steps.map((st, i) => (
                <InfoCard key={st.title} label={String(i + 1).padStart(2, "0")} title={st.title} line={st.line} tone={i % 4 === 3 ? "dark" : "surface"} delay={0.1 * (i % 3)} className="min-h-[200px] justify-between" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {s.facts && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead badge={t("services.detail.facts.badge", "At a glance")} title={t("services.detail.facts.title", "IELTS at a glance")} />
              <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[10px] lg:grid-cols-4">
                {s.facts.map((f, i) => (
                  <Appear key={f.label} delay={0.1 * i} className={`flex min-h-[200px] flex-col justify-between gap-[30px] overflow-hidden rounded-[10px] p-5 md:rounded-[30px] md:p-[30px] ${i === 1 ? "icon-dark" : i === 3 ? "bg-[linear-gradient(90deg,#406ae4_0%,#3b82f6_100%)]" : "bg-surface"}`}>
                    <h3 className={`t-stat ${i === 1 || i === 3 ? "!text-white" : ""}`}>{f.value}</h3>
                    <p className={`t-base ${i === 1 ? "text-gray-text" : i === 3 ? "text-surface" : "text-muted"}`}>{f.label}</p>
                  </Appear>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {s.list && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
              <h2 className="t-h3">{s.listTitle}</h2>
              <div className="flex flex-wrap justify-center gap-[10px]">
                {s.list.map((item) => <Chip key={item} tone="white" wrap>{item}</Chip>)}
              </div>
              <PillButton href="/contact/book-consultation" tone="dark">{t("services.detail.list.cta", "Book a consultation")}</PillButton>
            </Appear>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">{t("services.detail.faq.title", "Common questions")}</h2>
                <p className="t-body text-muted">{t("services.detail.faq.lead", "Answers from the Goodluck team.")}</p>
              </div>
              <FaqCta faces={faces} className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={related} />
            </Appear>
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead align="left" badge={t("services.detail.others.badge", "More services")} title={t("services.detail.others.title", "Other ways we can help")} />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px]">
              {others.map((o, i) => (
                <Appear key={o.slug} delay={0.1 * i} className="h-[300px]">
                  <ServiceCard service={o} slug={o.slug} label={o.label} title={o.title} line={o.line} image={o.image} imageAlt={o.imageAlt} />
                </Appear>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
