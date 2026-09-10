import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
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
      <h1 className="t-h4">Write a post</h1>
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
