import { gl, img } from "@/lib/assets";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg } from "@/components/ui/bits";

// Both lists come straight from goodluck_main: the five "reason for choosing us" points and the four homepage promises.
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

          <div className="grid w-full gap-5 md:gap-[30px] lg:grid-cols-[1.15fr_1fr]">
            <Appear delay={0.2} className="flex flex-col gap-[6px] rounded-[10px] bg-white p-[6px] md:rounded-[20px]">
              <div className="relative aspect-[4/3] w-full overflow-clip rounded-[6px] ring-1 ring-black/10 md:rounded-[14px] lg:aspect-auto lg:flex-1 lg:min-h-[360px]">
                <img src={gl.banner} alt={gl.bannerAlt} className="absolute inset-0 size-full object-cover object-right" />
              </div>
              <div className="grid grid-cols-2 gap-[6px]">
                {about.whyHome.map((w) => (
                  <div key={w} className="flex items-center gap-3 rounded-[6px] bg-surface px-4 py-3 md:rounded-[14px] md:px-5 md:py-4">
                    <span className="btn-blue flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-[#5290f4]">
                      <img src={img.check} alt="" className="brightness-0 invert" style={{ width: 12, height: 9 }} />
                    </span>
                    <p className="text-[15px] font-semibold leading-[19.5px] text-ink md:text-[16px] md:leading-[20.8px]">{w}</p>
                  </div>
                ))}
              </div>
            </Appear>

            <div className="flex flex-col gap-[10px] md:gap-[14px]">
              {about.whyChoose.map((c, i) => (
                <Appear key={c} delay={0.15 + 0.07 * i} className="flex items-center gap-4 rounded-[10px] bg-white/85 p-4 ring-1 ring-inset ring-white/70 backdrop-blur-[16px] md:rounded-[20px] md:p-5">
                  <span className="icon-dark flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[14px] font-semibold text-white ring-1 ring-inset ring-white/10 md:size-12 md:text-[16px]">0{i + 1}</span>
                  <p className="text-[16px] font-semibold leading-[20.8px] text-ink md:text-[18px] md:leading-[23.4px]">{c}</p>
                </Appear>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
