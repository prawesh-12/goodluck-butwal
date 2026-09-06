import type { Metadata } from "next";
import articles from "@/content/articles.json";
import { InnerHero } from "@/components/inner";
import { NewsList } from "@/components/news-list";

export const metadata: Metadata = { title: "News and updates", description: `${articles.length} articles from the Goodluck team.` };

export default function NewsPage() {
  return (
    <>
      <InnerHero badge="News and updates" badgeTone="chip" title="Study abroad insights and visa tips" lead={`${articles.length} articles from the Goodluck team.`} clouds={false} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <NewsList articles={articles} />
        </div>
      </section>
    </>
  );
}
