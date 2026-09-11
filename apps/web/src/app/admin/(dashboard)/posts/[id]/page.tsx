import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader, PreviewButton, ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { PostForm } from "@/features/posts/components/post-form";
import { pickedMedia } from "@/features/media/admin-queries";
import { editorialOptions, getAdminPost } from "@/features/posts/admin-queries";

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
      <EditorHeader
        backHref="/admin/posts"
        backLabel="News"
        title={post.title}
        meta={<StatusBadge status={post.status} />}
        actions={
          <>
            <PreviewButton href={`/preview/post/${post.slug}`} />
            {post.status === "published" ? <ViewOnSiteButton href={`/news/${post.slug}`} /> : null}
          </>
        }
      />

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
