import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { PostForm, type PostValues } from "@/features/posts/components/post-form";
import { editorialOptions } from "@/features/posts/admin-queries";

export const dynamic = "force-dynamic";

const empty: PostValues = {
  title: "",
  slug: "",
  excerpt: "",
  bodyHtml: "",
  bannerImageId: "",
  categoryId: "",
  officeId: "",
  destinationId: "",
  tagIds: [],
  authorDisplayName: "",
  status: "draft",
};

export default async function NewPostPage() {
  const actor = await requireActor();
  allow(actor, "posts", "create");

  const options = await editorialOptions();

  return (
    <>
      <EditorHeader
        backHref="/admin/posts"
        backLabel="News"
        title="New article"
        meta={<StatusBadge status="draft" />}
      />
      <PostForm
        values={empty}
        options={options}
        banner={null}
        canPublish={can(actor, "posts", "publish")}
        canDelete={false}
      />
    </>
  );
}
