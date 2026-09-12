import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listServiceFaqs } from "@/features/services/queries";
import { listDestinations } from "@/features/destinations/queries";
import { Appear } from "@/components/ui/appear";
import { InfoCard, InnerHero, SectionHead } from "@/components/shared/inner";
import { DestinationCard, destinationCards } from "@/features/destinations/components/destinations";
import { Accordion, FaqCta } from "@/components/shared/faqs";
import { listTeam } from "@/features/team/queries";
import { loadText } from "@/features/site-text/queries";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/destinations",
    title: "Destinations",
    description: "Study in Australia, the United Kingdom and New Zealand with Goodluck.",
  });
}

export default async function StudyAbroadPage() {
  const [faces, education, cards, t] = await Promise.all([
    listTeam().then((team) => team.slice(0, 3)),
    listServiceFaqs("education-counselling"),
    listDestinations().then((rows) => destinationCards(rows)),
    loadText(),
  ]);

  const helpWeProvide = [
    t("study.help.1", "Document check"),
    t("study.help.2", "Application process"),
    t("study.help.3", "Visa application"),
    t("study.help.4", "Follow-up with embassy"),
    t("study.help.5", "Language coaching"),
  ];

  return (
    <>
      <InnerHero badge={t("study.hero.badge", "Destinations")} title={t("study.hero.title", "Countries we help you study in")} lead={t("study.hero.lead", "Study in Australia, the United Kingdom and New Zealand with us.")} width={1260} after={
        <div className="grid w-full gap-[10px] md:grid-cols-3 md:gap-[30px]">
          {cards.map((d, i) => (
            <div key={d.slug} id={d.slug}><Appear delay={0.1 * i}><DestinationCard cards={cards} slug={d.slug} /></Appear></div>
          ))}
        </div>
      } />
      <section className="flex w-full flex-col items-center pb-[100px] md:pb-[160px] lg:pb-[200px]">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("study.help.badge", "How we help")} title={t("study.help.title", "Some of the help we provide")} />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px] lg:grid-cols-5">
              {helpWeProvide.map((h, i) => (
                <InfoCard key={h} label={`0${i + 1}`} title={h} tone={i === 2 ? "dark" : "surface"} delay={0.1 * (i % 3)} className="min-h-[180px] justify-between" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">{t("study.faq.title", "Education services FAQ")}</h2>
                <p className="t-body text-muted">{t("study.faq.lead", "Common questions about programmes, universities and scholarships.")}</p>
              </div>
              <FaqCta faces={faces} className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={education} />
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
