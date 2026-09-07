import { img } from "@/lib/assets";
import { googleRating, reviews } from "@/content/stories";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg, Ticker } from "@/components/ui/bits";

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
        <p className="t-body line-clamp-7 text-ink">{r.quote}</p>
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
    <section id="why-goodluck" className="pb-section relative flex w-full flex-col items-center overflow-clip">
      <SectionBg src={img.testimonialBg} top bottom soft />
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
          <Appear delay={0.15} className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="t-h4">What our clients say</h3>
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
          <Appear delay={0.2} className="flex w-full flex-col gap-5 md:hidden">
            {reviews.slice(0, 4).map((r) => (
              <ReviewCard key={r.name} r={r} />
            ))}
          </Appear>
          <Appear delay={0.2} className="hidden w-full md:block">
            <Ticker gap={20} speed={70} className="w-full !overflow-visible md:[--gap-override:20px] lg:[--gap-override:50px]">
              {reviews.map((r) => (
                <ReviewCard key={r.name} r={r} className="h-[380px] w-[400px] shrink-0" />
              ))}
            </Ticker>
          </Appear>
        </div>
      </div>
    </section>
  );
}
