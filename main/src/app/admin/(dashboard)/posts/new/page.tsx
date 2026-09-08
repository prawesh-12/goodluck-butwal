import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { PostForm, type PostValues } from "@/components/admin/post-form";
import { editorialOptions } from "@/server/queries/admin-editorial";

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
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  seoOgImageId: "",
  seoNoindex: false,
  canonicalUrl: "",
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
        shareImage={null}
        canPublish={can(actor, "posts", "publish")}
        canDelete={false}
      />
    </>
  );
}
