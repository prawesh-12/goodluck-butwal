import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTag, listArticlesByTag } from "@/server/queries/editorial";
import { InnerHero } from "@/components/inner";
import { NewsList } from "@/components/news-list";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTag((await params).slug);
  return tag ? { title: `Articles tagged ${tag.name}` } : { title: "News" };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const [tag, articles] = await Promise.all([getTag(slug), listArticlesByTag(slug)]);
  if (!tag) notFound();

  return (
    <>
      <InnerHero badge="News and updates" badgeTone="chip" title={tag.name} lead={`${articles.length} ${articles.length === 1 ? "article" : "articles"} tagged ${tag.name}.`} clouds={false} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <NewsList articles={articles} />
        </div>
      </section>
    </>
  );
}
