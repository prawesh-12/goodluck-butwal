import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PostForm } from "@/features/posts/components/post-form";
import { pickedMedia } from "@/features/media/admin-queries";
import { editorialOptions } from "@/features/posts/admin-queries";
import { getAdminPost } from "@/features/posts/admin-queries";

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
    pickedMedia([post.bannerImageId]),
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
        }}
        options={options}
        banner={media[post.bannerImageId ?? ""] ?? null}
        canPublish={can(actor, "posts", "publish")}
        canDelete={can(actor, "posts", "delete")}
      />
    </>
  );
}
