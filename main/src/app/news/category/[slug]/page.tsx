import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listArticlesByCategory, listCategories } from "@/server/queries/editorial";
import { InnerHero } from "@/components/inner";
import { NewsList } from "@/components/news-list";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () =>
  (await listCategories()).map((category) => ({ slug: category.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await listCategories()).find((c) => c.slug === slug);
  return category ? { title: `${category.name} articles` } : { title: "News" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, articles] = await Promise.all([
    listCategories().then((all) => all.find((c) => c.slug === slug)),
    listArticlesByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <>
      <InnerHero badge="News and updates" badgeTone="chip" title={category.name} lead={`${articles.length} ${articles.length === 1 ? "article" : "articles"} in this category.`} clouds={false} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <NewsList articles={articles} />
        </div>
      </section>
    </>
  );
}
