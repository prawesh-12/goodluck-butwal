import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serviceBySlug, services } from "@/content/services";
import { faqs } from "@/content/faqs";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, SectionHead } from "@/components/inner";
import { ServiceCard } from "@/components/home/services";
import { Accordion, FaqCta } from "@/components/home/faqs";

type Props = { params: Promise<{ slug: string }> };
export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = serviceBySlug((await params).slug);
  return s ? { title: s.title, description: s.intro } : { title: "Service" };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) notFound();
  const related = s.slug === "visa-guidance" ? faqs.migration : faqs.education;
  const others = services.filter((o) => o.slug !== s.slug);

  return (
    <>
      <InnerHero badge={s.label} badgeTone="chip-white" title={s.title} lead={s.intro} bg="field" width={1260} gap="gap-5 md:gap-10 lg:gap-[50px]" after={
        <Appear delay={0.1} className="w-full">
          <div className="aspect-[4/3] w-full overflow-clip rounded-[10px] bg-white ring-1 ring-hairline md:aspect-[2/1] md:rounded-[30px]">
            <img src={s.image} alt={s.imageAlt} className="size-full object-contain p-6 md:p-10" />
          </div>
        </Appear>
      } />

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge="How it works" title={s.stepsTitle} />
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
              <SectionHead badge="At a glance" title="IELTS at a glance" />
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
              <PillButton href="/contact/book-consultation" tone="dark">Book a consultation</PillButton>
            </Appear>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">Common questions</h2>
                <p className="t-body text-muted">Answers from the Goodluck team.</p>
              </div>
              <FaqCta className="order-3 md:order-none" />
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
            <SectionHead align="left" badge="More services" title="Other ways we can help" />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px]">
              {others.map((o, i) => (
                <Appear key={o.slug} delay={0.1 * i} className="h-[300px]">
                  <ServiceCard slug={o.slug} label={o.label} title={o.title} line={o.line} image={o.image} imageAlt={o.imageAlt} />
                </Appear>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
