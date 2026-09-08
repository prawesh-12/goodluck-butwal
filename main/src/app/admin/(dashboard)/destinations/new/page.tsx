import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { DestinationEditor } from "@/components/admin/destination-editor";

export const dynamic = "force-dynamic";

export default async function NewDestinationPage() {
  const actor = await requireActor();
  allow(actor, "destinations", "create");

  return (
    <>
      <h1 className="t-h4">New destination</h1>
      <DestinationEditor
        canDelete={false}
        canPublish={can(actor, "destinations", "publish")}
        media={{}}
        value={{
          slug: "",
          name: "",
          countryCode: "",
          tagline: "",
          heroImageId: null,
          flagImageId: null,
          cardImageId: null,
          factPill: "",
          overviewHtml: "",
          academicHtml: "",
          workHtml: "",
          isFeatured: false,
          hasPage: true,
          status: "draft",
          sortOrder: 0,
          migrationTitle: "",
          whyTitle: "",
          checklistTitle: "",
          highlights: [],
          why: [],
          checklist: [],
          intakes: [],
          migration: [],
          costs: [],
          help: [],
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
