import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ServiceEditor } from "@/components/admin/service-editor";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const actor = await requireActor();
  allow(actor, "services", "create");

  return (
    <>
      <h1 className="t-h4">New service</h1>
      <ServiceEditor
        canDelete={false}
        canPublish={can(actor, "services", "publish")}
        media={{}}
        value={{
          slug: "",
          name: "",
          category: "education",
          officeScope: actor.role === "au_admin" ? "au" : actor.role === "np_admin" ? "np" : "both",
          summary: "",
          introHtml: "",
          steps: [],
          facts: [],
          documents: [],
          artworkId: null,
          reelId: null,
          posterImageId: null,
          tone: "blue",
          isFeatured: false,
          status: "draft",
          sortOrder: 0,
          label: "",
          stepsTitle: "",
          listTitle: "",
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
