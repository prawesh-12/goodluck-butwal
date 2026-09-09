import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageEditor } from "@/features/pages/components/page-editor";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const actor = await requireActor();
  allow(actor, "pages", "create");

  return (
    <>
      <h1 className="t-h4">New page</h1>
      <PageEditor
        canDelete={false}
        canPublish={can(actor, "pages", "publish")}
        media={{}}
        value={{
          slug: "",
          parent: "about",
          title: "",
          intro: "",
          bodyHtml: "",
          heroImageId: null,
          showInNav: false,
          status: "draft",
          sortOrder: 0,
          blocks: {},
          seoTitle: "",
          seoDescription: "",
          seoOgImageId: null,
          seoNoindex: false,
          canonicalUrl: "",
        }}
      />
    </>
  );
}
