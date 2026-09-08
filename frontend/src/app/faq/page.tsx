import type { Metadata } from "next";
import { faqs } from "@/content/faqs";
import { Appear } from "@/components/ui/appear";
import { InnerHero } from "@/components/inner";
import { Accordion, FaqCta } from "@/components/home/faqs";

export const metadata: Metadata = { title: "FAQ" };
const groups: [string, typeof faqs.education][] = [["Education services", faqs.education], ["Migration services", faqs.migration]];

export default function FaqPage() {
  return (
    <>
      <InnerHero title="Frequently asked questions" lead="Any questions? Book an appointment and our team can assess your case." />
      <section className="flex w-full flex-col items-center pb-[50px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <div className="flex flex-col items-center gap-[30px] md:gap-[50px]">
            {groups.map(([title, items], i) => (
              <Appear key={title} delay={0.05 * i} className="flex w-full flex-col items-center gap-5 rounded-[10px] bg-surface p-5 md:gap-[30px] md:rounded-[30px] md:p-[30px] lg:p-[50px]">
                <h2 className="t-h4 text-center">{title}</h2>
                <Accordion items={items} variant="white" defaultOpen={i === 0 ? 0 : null} />
              </Appear>
            ))}
            <FaqCta />
          </div>
        </div>
      </section>
    </>
  );
}
