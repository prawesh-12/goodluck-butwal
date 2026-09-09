import { img } from "@/config/assets";
import type { GoogleRating } from "@/features/settings/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, SectionBg, Ticker } from "@/components/ui/bits";
import { loadText } from "@/features/site-text/queries";

// The twelve success-story graphics carry their own text, so each sits on a plain white plate and nothing else is added.


function StoryCard({ s, tilt }: { s: { image: string; alt: string }; tilt: number }) {
  return (
    <div
      style={{ rotate: `${tilt}deg` }}
      className="shrink-0 rounded-[18px] bg-white p-2 shadow-[0_18px_40px_-18px_rgba(29,29,29,0.25)] ring-1 ring-hairline transition-transform duration-300 hover:-translate-y-2 hover:!rotate-0 md:rounded-[22px] md:p-[10px]"
    >
      <div className="size-[180px] overflow-clip rounded-[12px] bg-surface md:size-[250px] md:rounded-[14px] lg:size-[290px] lg:rounded-[16px]">
        <img src={s.image} alt={s.alt} className="size-full object-cover" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

export async function Stories({ successStories, googleRating }: { successStories: { image: string; alt: string }[]; googleRating: GoogleRating }) {
  const t = await loadText();
  const rows = [successStories.slice(0, 6), successStories.slice(6)];
  return (
    <section id="success-stories" className="flex w-full flex-col items-center">
      <div className="pb-section relative w-full overflow-clip bg-white pt-[60px] md:pt-[100px]">
        <SectionBg src={img.storiesBg} top bottom soft position="50% 50%" />
        <div className="relative z-[1] flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[60px]">
          <Appear className="container-x flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="flex max-w-[620px] flex-col items-start gap-[10px]">
              <Badge tone="white" className="ring-1 ring-hairline">{t("home.stories.badge", "Success stories")}</Badge>
              <h2 className="t-h2">{t("home.stories.title", "Highly recommended")}</h2>
              <p className="t-body text-muted">{t("home.stories.lead", "Visa grants and reviews shared by our clients.")}</p>
            </div>
            <div className="flex items-center gap-4 rounded-[20px] bg-white p-4 ring-1 ring-hairline md:gap-5 md:rounded-[24px] md:p-5">
              <span className="t-stat">{googleRating.score}</span>
              <div className="flex flex-col gap-[6px]">
                <img src={img.stars5} alt="Five stars" className="h-[16px] w-[97px]" loading="lazy" decoding="async" />
                <p className="t-small text-muted">{t("home.stories.rating", "from {count} Google reviews").replace("{count}", String(googleRating.count))}</p>
              </div>
            </div>
          </Appear>

          <Appear delay={0.1} className="flex w-full flex-col gap-5 md:gap-[30px]">
            {rows.map((row, r) => (
              <Ticker key={r} gap={24} speed={r ? 150 : 120} reverse={r === 1} className="w-full py-4">
                {row.map((s, i) => (
                  <StoryCard key={s.image} s={s} tilt={(i + r) % 2 ? 2.5 : -2.5} />
                ))}
              </Ticker>
            ))}
          </Appear>

          <Appear delay={0.2}>
            <PillButton href="/success-stories" tone="dark">
              {t("home.stories.cta", "All success stories")}
            </PillButton>
          </Appear>
        </div>
      </div>
    </section>
  );
}
