import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listServices } from "@/features/services/queries";
import { listAllFaqs } from "@/features/services/queries";
import { Appear } from "@/components/ui/appear";
import { InnerHero } from "@/components/shared/inner";
import { ServiceCard } from "@/features/services/components/services";
import { Accordion, FaqCta } from "@/components/shared/faqs";
import { listTeam } from "@/features/team/queries";
import { loadText } from "@/features/site-text/queries";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/services",
    title: "Our services",
    description: "Education counselling, visa guidance, scholarship guidance and IELTS coaching.",
  });
}

export default async function ServicesPage() {
  const [faces, services, allFaqs, t] = await Promise.all([
    listTeam().then((team) => team.slice(0, 3)),
    listServices(),
    listAllFaqs(),
    loadText(),
  ]);

  return (
    <>
      <InnerHero badge={t("services.hero.badge", "Our services")} title={t("services.hero.title", "Get the right help")} lead={t("services.hero.lead", "We have the perfect solution for international students. Now, they no longer have to worry about education counselling, finding work, obtaining visas, or anything else.")} width={1260} after={
        <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
          {services.map((s, i) => (
            <Appear key={s.slug} delay={0.1 * i} className="min-w-0">
              <ServiceCard service={s} slug={s.slug} label={s.label} title={s.title} line={s.line} image={s.image} imageAlt={s.imageAlt} />
            </Appear>
          ))}
        </div>
      } />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">{t("services.faq.title", "Frequently asked questions")}</h2>
                <p className="t-body text-muted">{t("services.faq.lead", "Common questions about programmes, universities and scholarships.")}</p>
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
