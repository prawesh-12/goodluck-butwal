import { img } from "@/config/assets";
import type { GoogleRating } from "@/features/settings/queries";
import type { PublicReview } from "@/features/testimonials/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg } from "@/components/ui/bits";
import { Marquee } from "@/components/ui/marquee";
import { loadText, type Text } from "@/features/site-text/queries";

const metaFor = (googleRating: GoogleRating, t: Text) => [
  { icon: img.star, w: 19, text: t("home.reviews.rating", "{score} Google rating").replace("{score}", googleRating.score) },
  { icon: img.heart, w: 20, text: t("home.reviews.count", "{count} reviews").replace("{count}", String(googleRating.count)) },
];

// Google reviews from the goodluck_main widget. Reviewers have no photos there, so an initial stands in.
export function ReviewCard({ r, className = "" }: { r: PublicReview; className?: string }) {
  return (
    <div className={`flex flex-col items-start justify-between overflow-hidden rounded-[10px] bg-white p-5 md:rounded-[30px] md:p-10 ${className}`}>
      <div className="flex flex-col items-start gap-4 pb-10">
        <img src={img.stars5} alt="Five stars" className="h-[18px] w-[109px]" loading="lazy" decoding="async" />
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

// Magic UI's testimonial card: photo, name and source up top, stars where the bird icon sits, quote below.
function ReviewTile({ r, source }: { r: PublicReview; source: string }) {
  return (
    <figure className="flex w-[300px] flex-col gap-4 rounded-2xl border border-hairline bg-white p-5 md:w-[400px]">
      <div className="flex flex-wrap items-center gap-3">
        <img src={r.avatar} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-surface object-cover" loading="lazy" decoding="async" />
        <figcaption className="flex min-w-[150px] flex-1 flex-col gap-[2px]">
          <p className="text-[16px] font-medium leading-5 text-ink">{r.name}</p>
          <p className="t-small whitespace-nowrap text-muted">{source.replace("{date}", r.date)}</p>
        </figcaption>
        <img src={img.stars5} alt="Five stars" className="ml-auto h-[14px] w-[85px]" loading="lazy" decoding="async" />
      </div>
      <blockquote className="t-base text-ink">{r.quote}</blockquote>
    </figure>
  );
}

// Two rows like the Magic UI marquee demo: top drifts right, bottom drifts left. Linear, since it never stops.


export async function Reviews({ reviews, googleRating, values }: { reviews: PublicReview[]; googleRating: GoogleRating; values: string }) {
  const t = await loadText();
  const meta = metaFor(googleRating, t);
  const rows = [reviews.slice(0, 3), reviews.slice(3)];
  return (
    <section id="why-goodluck" className="pb-section relative flex w-full flex-col items-center overflow-clip">
      <SectionBg src={img.testimonialBg} top bottom soft />
      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
          <div className="flex w-full max-w-[800px] flex-col items-center gap-5 lg:gap-10">
            <Appear className="flex flex-col items-center gap-[10px]">
              <Badge className="ring-1 ring-hairline">{t("home.reviews.badge", "Why choose us")}</Badge>
              <h2 className="t-h2 text-center">{t("home.reviews.title", "Reason for choosing us")}</h2>
              <p className="t-body text-center text-muted">{values}</p>
            </Appear>
            <Appear delay={0.1} className="flex flex-wrap items-center justify-center gap-[10px] md:gap-5">
              <PillButton href="/about">{t("home.reviews.cta", "About Goodluck")}</PillButton>
            </Appear>
          </div>
          <Appear delay={0.15} className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="t-h4">{t("home.reviews.clients_title", "What our clients say")}</h3>
            <div className="flex flex-wrap items-center gap-[10px] md:gap-5">
              {meta.map((m, i) => (
                <div key={m.text} className="contents">
                  {i > 0 && <span aria-hidden className="h-[22px] w-px bg-ink opacity-30" />}
                  <div className="flex items-start gap-[6px]">
                    <span className="flex h-[22px] items-center">
                      <img src={m.icon} alt="" style={{ width: m.w, height: 18 }} loading="lazy" decoding="async" />
                    </span>
                    <p className="t-base text-muted">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Appear>
        </div>
      </div>
      <Appear delay={0.2} className="relative z-[1] mt-[30px] flex w-full flex-col gap-5 md:mt-10 lg:mt-[50px]">
        {rows.map((row, i) => (
          <Marquee key={i} pauseOnHover reverse={i === 0} className="p-0 [--duration:32s] [--gap:20px]">
            {row.map((r) => <ReviewTile key={r.name} r={r} source={t("home.reviews.source", "Google review, {date}")} />)}
          </Marquee>
        ))}
      </Appear>
    </section>
  );
}
