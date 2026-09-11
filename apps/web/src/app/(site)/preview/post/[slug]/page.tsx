import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets, postCategories, posts } from "@goodluck/db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { previewMetadata } from "@/lib/security/preview";
import { Appear } from "@/components/ui/appear";
import { Chip } from "@/components/ui/bits";
import { InnerHero } from "@/components/shared/inner";
import { formatDate } from "@/lib/utils/datetime";
import { Img } from "@/components/ui/img";

export const metadata = previewMetadata;
export const dynamic = "force-dynamic";

export default async function PostPreview({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await requireActor();
  allow(actor, "posts", "read");

  const { slug } = await params;
  const [post] = await db
    .select({
      title: posts.title,
      excerpt: posts.excerpt,
      html: posts.bodyHtml,
      status: posts.status,
      publishedAt: posts.publishedAt,
      category: postCategories.name,
      image: mediaAssets.staticPath,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(mediaAssets, eq(posts.bannerImageId, mediaAssets.id))
    .where(eq(posts.slug, slug));

  if (!post) notFound();
  const date = post.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : "";

  return (
    <>
      <InnerHero
        bg="field"
        clouds={false}
        pb="pb-[50px]"
        size="md"
        title={post.title}
        lead={post.excerpt ?? ""}
        className="[&_h1]:order-2 [&_p]:order-3"
      >
        <div className="order-1 flex items-center gap-[10px]">
          <Chip>{post.category ?? "No category"}</Chip>
          {date ? (
            <time dateTime={date} className="t-small text-muted">
              {formatDate(date)}
            </time>
          ) : null}
        </div>
      </InnerHero>

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[50px]">
            <p className="t-small text-muted">
              Preview of a {post.status} article. Only signed-in staff can open this address, and
              search engines are told to ignore it.
            </p>
            {post.image ? (
              <Appear
                y={10}
                duration={0.6}
                className="aspect-[1533/458] w-full overflow-clip rounded-[10px] md:rounded-[20px]"
              >
                <Img
                  src={post.image}
                  alt={post.title}
                  sizes="(min-width: 810px) 800px, 100vw"
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </Appear>
            ) : null}
            <div
              className="article article-scroll w-full max-w-[800px]"
              dangerouslySetInnerHTML={{ __html: post.html ?? "" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
