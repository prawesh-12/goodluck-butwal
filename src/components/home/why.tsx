import { img } from "@/lib/assets";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg } from "@/components/ui/bits";

export function Why() {
  return (
    <section id="why-goodluck" className="py-section relative flex w-full flex-col items-center">
      <SectionBg src={img.overviewBg} top bottom />
      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
          <div className="flex w-full max-w-[800px] flex-col items-center gap-5 lg:gap-10">
            <Appear className="flex flex-col items-center gap-[10px]">
              <Badge className="ring-1 ring-hairline">Why choose us</Badge>
              <h2 className="t-h2 text-center">Reason for choosing us</h2>
              <p className="t-body text-center text-muted">{about.values}</p>
            </Appear>
            <Appear delay={0.1} className="flex flex-wrap items-center justify-center gap-[10px] md:gap-5">
              <PillButton href="/about">About Goodluck</PillButton>
            </Appear>
          </div>
        </div>
      </div>
    </section>
  );
}
