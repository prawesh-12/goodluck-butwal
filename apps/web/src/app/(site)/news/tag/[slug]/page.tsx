import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { notFound } from "next/navigation";
import { getTag, listArticlesByTag } from "@/features/posts/queries";
import { InnerHero } from "@/components/shared/inner";
import { NewsList } from "@/features/posts/components/news-list";
import { loadText } from "@/features/site-text/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  return tag
    ? buildMetadata({ path: `/news/tag/${slug}`, title: `Articles tagged ${tag.name}` })
    : buildMetadata({ path: "/news", title: "News", noindex: true });
}

export default async function TagPage({ params }: Props) {
  const t = await loadText();
  const { slug } = await params;
  const [tag, articles] = await Promise.all([getTag(slug), listArticlesByTag(slug)]);
  if (!tag) notFound();

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "News", path: "/news" }, { name: tag.name, path: `/news/tag/${slug}` }])} />
      <InnerHero badge={t("news.hero.badge", "News and updates")} badgeTone="chip" title={tag.name} lead={`${articles.length} ${articles.length === 1 ? "article" : "articles"} tagged ${tag.name}.`} clouds={false} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <NewsList articles={articles} />
        </div>
      </section>
    </>
  );
}
