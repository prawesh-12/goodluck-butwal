import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { PostForm } from "@/components/admin/post-form";
import { pickedMedia } from "@/server/queries/admin-people";
import { editorialOptions, getAdminPost } from "@/server/queries/admin-editorial";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "posts", "update");

  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  allowOwn(actor, post);

  const [options, media] = await Promise.all([
    editorialOptions(),
    pickedMedia([post.bannerImageId, post.seoOgImageId]),
  ]);

  return (
    <>
      <h1 className="t-h4">{post.title}</h1>
      <p className="t-small admin-help">
        <a href={`/news/${post.slug}`} target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <PostForm
        values={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          bodyHtml: post.bodyHtml ?? "",
          bannerImageId: post.bannerImageId ?? "",
          categoryId: post.categoryId ?? "",
          officeId: post.officeId ?? "",
          destinationId: post.destinationId ?? "",
          tagIds: post.tagIds,
          authorDisplayName: post.authorDisplayName ?? "",
          status: post.status,
          publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 16) : "",
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          seoOgImageId: post.seoOgImageId ?? "",
          seoNoindex: post.seoNoindex,
          canonicalUrl: post.canonicalUrl ?? "",
        }}
        options={options}
        banner={media.get(post.bannerImageId ?? "") ?? null}
        shareImage={media.get(post.seoOgImageId ?? "") ?? null}
        canPublish={can(actor, "posts", "publish")}
        canDelete={can(actor, "posts", "delete")}
      />
    </>
  );
}
