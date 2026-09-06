import { img } from "@/lib/assets";
import { googleRating, reviews } from "@/content/stories";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { SectionBg, Ticker } from "@/components/ui/bits";

const meta = [
  { icon: img.star, w: 19, text: `${googleRating.score} Google rating` },
  { icon: img.heart, w: 20, text: `${googleRating.count} reviews` },
];

// Google reviews from the goodluck_main widget. Reviewers have no photos there, so an initial stands in.
export function ReviewCard({ r, className = "" }: { r: (typeof reviews)[number]; className?: string }) {
  return (
    <div className={`flex flex-col items-start justify-between overflow-hidden rounded-[10px] bg-white p-5 md:rounded-[30px] md:p-10 ${className}`}>
      <div className="flex flex-col items-start gap-4 pb-10">
        <img src={img.stars5} alt="Five stars" className="h-[18px] w-[109px]" />
        <p className="t-body text-ink">{r.quote}</p>
      </div>
      <div className="flex items-start gap-4">
        <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-surface font-display text-[20px] font-semibold text-ink">{r.name[0]}</span>
        <div className="flex flex-col justify-center gap-[2px]">
          <p className="text-[18px] font-medium leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]">{r.name}</p>
          <p className="t-small text-muted">Google review, {r.date}</p>
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  return (
    <section className="py-section relative flex w-full flex-col items-center overflow-clip">
      <SectionBg src={img.testimonialBg} top bottom />
      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-start gap-[30px] lg:gap-[50px]">
          <div className="flex w-full flex-col gap-5 md:flex-row md:items-end md:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-5">
              <h2 className="t-h2 max-w-[719px]">What our clients say</h2>
              <div className="flex flex-wrap items-center gap-[10px] md:gap-5">
                {meta.map((m, i) => (
                  <div key={m.text} className="contents">
                    {i > 0 && <span aria-hidden className="h-[22px] w-px bg-ink opacity-30" />}
                    <div className="flex items-start gap-[6px]">
                      <span className="flex h-[22px] items-center">
                        <img src={m.icon} alt="" style={{ width: m.w, height: 18 }} />
                      </span>
                      <p className="t-base text-muted">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start md:items-end">
              <PillButton href="/success-stories" tone="dark">
                Success stories
              </PillButton>
            </Appear>
          </div>
          <Appear delay={0.2} className="flex w-full flex-col gap-5 md:hidden">
            {reviews.slice(0, 4).map((r) => (
              <ReviewCard key={r.name} r={r} />
            ))}
          </Appear>
          <Appear delay={0.2} className="hidden w-full md:block">
            <Ticker gap={20} speed={70} align="end" className="w-full !overflow-visible md:[--gap-override:20px] lg:[--gap-override:50px]">
              {reviews.map((r) => (
                <ReviewCard key={r.name} r={r} className="min-h-[300px] w-[400px] shrink-0" />
              ))}
            </Ticker>
          </Appear>
        </div>
      </div>
    </section>
  );
}
