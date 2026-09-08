import type { Metadata } from "next";
import { notFound } from "next/navigation";
import articles from "@/content/articles.json";
import { Appear } from "@/components/ui/appear";
import { Chip } from "@/components/ui/bits";
import { InnerHero, NewsCard, SectionHead } from "@/components/inner";
import { formatDate } from "@/lib/datetime";
import { FaqCta } from "@/components/home/faqs";

type Props = { params: Promise<{ slug: string }> };
export const generateStaticParams = () => articles.map((a) => ({ slug: a.slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.excerpt, openGraph: { images: [a.image], type: "article", publishedTime: a.date } } : { title: "News" };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  if (!a) notFound();
  const more = articles.filter((x) => x.slug !== slug && x.category === a.category).concat(articles.filter((x) => x.slug !== slug && x.category !== a.category)).slice(0, 3);
  return (
    <>
      <InnerHero bg="field" clouds={false} pb="pb-[50px]" size="md" title={a.title} lead={a.excerpt} className="[&_h1]:order-2 [&_p]:order-3">
        <div className="order-1 flex items-center gap-[10px]">
          <Chip>{a.category}</Chip>
          <time dateTime={a.date} className="t-small text-muted">{formatDate(a.date)}</time>
        </div>
      </InnerHero>
      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[50px]">
            <Appear y={10} duration={0.6} className="aspect-[1533/458] w-full overflow-clip rounded-[10px] md:rounded-[20px]">
              <img src={a.image} alt={a.title} className="size-full object-cover" loading="lazy" decoding="async" />
            </Appear>
            <div className="article article-scroll w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: a.html }} />
            <div className="w-full max-w-[800px]"><FaqCta /></div>
          </div>
        </div>
      </section>
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-5 md:gap-10 lg:gap-[50px]">
            <SectionHead align="left" title="More articles" />
            <div className="grid gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
              {more.map((p, i) => <NewsCard key={p.slug} article={p} delay={0.05 * i} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""} />)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
