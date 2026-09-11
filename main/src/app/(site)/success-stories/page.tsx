import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { img } from "@/config/assets";
import { getGoogleRating } from "@/features/settings/queries";
import { reviews, successStories } from "@/config/testimonials";
import { loadText } from "@/features/site-text/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { SectionBg } from "@/components/ui/bits";
import { InnerHero } from "@/components/shared/inner";
import { ReviewCard } from "@/features/testimonials/components/reviews";
import { CARD_SIZES, Img } from "@/components/ui/img";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/success-stories",
    title: "Success stories",
    description: "Visa grants and reviews shared by our clients.",
  });
}

export default async function SuccessStoriesPage() {
  const [googleRating, t] = await Promise.all([getGoogleRating(), loadText()]);

  return (
    <>
      <InnerHero badge={t("stories.hero.badge", "Success stories")} title={t("stories.hero.title", "Highly recommended")} lead={t("stories.hero.lead", "Visa grants and reviews shared by our clients.")} width={1260} after={
        <div className="grid w-full grid-cols-2 gap-[10px] md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
          {successStories.map((s, i) => (
            <Appear key={s.image} delay={0.05 * (i % 4)} className="aspect-square overflow-clip rounded-[10px] bg-surface ring-1 ring-hairline md:rounded-[20px]">
              <Img src={s.image} alt={s.alt} sizes={CARD_SIZES} className="size-full object-cover" loading="lazy" decoding="async" />
            </Appear>
          ))}
        </div>
      } />
      <section className="py-section relative flex w-full flex-col items-center">
        <SectionBg src={img.testimonialBg} top bottom />
        <div className="container-x relative z-[1]">
          <div className="flex flex-col items-start gap-[30px] lg:gap-[50px]">
            <div className="flex w-full flex-col gap-5 md:flex-row md:items-end md:gap-[50px]">
              <Appear className="flex flex-1 flex-col items-start gap-5">
                <h2 className="t-h2 max-w-[719px]">{t("stories.reviews.title", "What our clients say")}</h2>
                <div className="flex flex-wrap items-center gap-[10px] md:gap-5">
                  <div className="flex items-start gap-[6px]">
                    <span className="flex h-[22px] items-center"><Img src={img.star} alt="" w={40} style={{ width: 19, height: 18 }} loading="lazy" decoding="async" /></span>
                    <p className="t-base text-muted">{t("stories.reviews.rating", "{score} Google rating").replace("{score}", googleRating.score)}</p>
                  </div>
                  <span aria-hidden className="h-[22px] w-px bg-ink opacity-30" />
                  <p className="t-base text-muted">{t("stories.reviews.count", "Based on {count} reviews").replace("{count}", String(googleRating.count))}</p>
                </div>
              </Appear>
              <Appear delay={0.1} className="flex flex-col items-start md:items-end">
                <PillButton href="/contact/book-consultation" tone="dark">{t("stories.reviews.cta", "Book a consultation")}</PillButton>
              </Appear>
            </div>
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Appear key={r.name} delay={0.1 * (i % 3)}><ReviewCard r={r} className="h-full" /></Appear>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
