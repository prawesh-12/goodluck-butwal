import type { PublicArticle } from "@/server/queries/editorial";
import { NewsCard } from "@/components/inner";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { loadText } from "@/server/queries/text";

export async function News({ articles }: { articles: PublicArticle[] }) {
  const t = await loadText();
  const latest = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return (
    <section id="news" className="pb-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
          <div className="flex w-full flex-col gap-[10px] md:flex-row md:items-end md:gap-[30px] lg:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">{t("home.news.badge", "News and updates")}</Badge>
              <h2 className="t-h2">{t("home.news.title", "Study abroad insights and visa tips")}</h2>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start md:items-end">
              <PillButton href="/news" tone="dark">
                {t("home.news.cta", "All news")}
              </PillButton>
            </Appear>
          </div>
          <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
            {latest.map((a, i) => (
              <NewsCard key={a.slug} article={a} delay={0.05 * i} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
