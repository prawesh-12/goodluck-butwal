import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@db/client";
import { pages } from "@db/schema";
import { InnerHero } from "@/components/shared/inner";

const SLUGS = ["privacy-policy", "terms"];

// Unpublished copy 404s rather than showing invented wording.
const getLegalPage = cache(async (slug: string) => {
  if (!SLUGS.includes(slug)) return undefined;
  const [row] = await db
    .select({ title: pages.title, intro: pages.intro, bodyHtml: pages.bodyHtml })
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.parent, "legal"), eq(pages.status, "published")));
  return row;
});

export const generateStaticParams = () => SLUGS.map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return buildMetadata({ path: "/legal", title: "Not found", noindex: true });
  return buildEntityMetadata("page", slug, {
    path: `/legal/${slug}`,
    title: page.title,
    description: page.intro,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: page.title, path: `/legal/${slug}` }])} />
      <InnerHero title={page.title} lead={page.intro ?? undefined} />
      <section className="pb-section flex w-full flex-col items-center">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <div className="article" dangerouslySetInnerHTML={{ __html: page.bodyHtml ?? "" }} />
        </div>
      </section>
    </>
  );
}
