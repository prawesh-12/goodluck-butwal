import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listArticles } from "@/features/posts/queries";
import { InnerHero } from "@/components/shared/inner";
import { NewsList } from "@/features/posts/components/news-list";
import { loadText } from "@/features/site-text/queries";

export async function generateMetadata(): Promise<Metadata> {
  const articles = await listArticles();
  return buildMetadata({
    path: "/news",
    title: "News and updates",
    description: `${articles.length} articles from the Goodluck team.`,
  });
}

export default async function NewsPage() {
  const t = await loadText();
  const articles = await listArticles();

  return (
    <>
      <InnerHero badge={t("news.hero.badge", "News and updates")} badgeTone="chip" title={t("news.hero.title", "Study abroad insights and visa tips")} lead={`${articles.length} articles from the Goodluck team.`} clouds={false} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <NewsList articles={articles} />
        </div>
      </section>
    </>
  );
}
