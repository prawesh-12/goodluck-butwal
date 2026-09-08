import type { Metadata } from "next";
import { helpWeProvide } from "@/content/destinations";
import { faqs } from "@/content/faqs";
import { Appear } from "@/components/ui/appear";
import { InfoCard, InnerHero, SectionHead } from "@/components/inner";
import { DestinationCard, destinationCards } from "@/components/home/destinations";
import { Accordion, FaqCta } from "@/components/home/faqs";
import { listTeam } from "@/server/queries/people";

export const metadata: Metadata = { title: "Study abroad", description: "Study in Australia, the United Kingdom and New Zealand with Goodluck." };

export default async function StudyAbroadPage() {
  const faces = (await listTeam()).slice(0, 3);

  return (
    <>
      <InnerHero badge="Study abroad" title="Countries we help you study in" lead="Study in Australia, the United Kingdom and New Zealand with us." width={1260} after={
        <div className="grid w-full gap-[10px] md:grid-cols-3 md:gap-[30px]">
          {destinationCards.map((d, i) => (
            <div key={d.slug} id={d.slug}><Appear delay={0.1 * i}><DestinationCard slug={d.slug} /></Appear></div>
          ))}
        </div>
      } />
      <section className="flex w-full flex-col items-center pb-[100px] md:pb-[160px] lg:pb-[200px]">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge="How we help" title="Some of the help we provide" />
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
                <h2 className="t-h2">Education services FAQ</h2>
                <p className="t-body text-muted">Common questions about programmes, universities and scholarships.</p>
              </div>
              <FaqCta faces={faces} className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={faqs.education} />
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
