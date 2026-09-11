import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { InstitutionEditor } from "@/features/institutions/components/institution-editor";
import { destinationOptions } from "@/features/courses/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewInstitutionPage() {
  const actor = await requireActor();
  allow(actor, "institutions", "create");

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/institutions" backLabel="Institutions" title="New institution" />
      <InstitutionEditor
        canDelete={false}
        canPublish={can(actor, "institutions", "publish")}
        media={{}}
        destinations={await destinationOptions()}
        value={{
          slug: "",
          name: "",
          logoId: null,
          destinationId: null,
          country: "",
          city: "",
          websiteUrl: "",
          descriptionHtml: "",
          isPartner: false,
          isFeatured: false,
          status: "draft",
          sortOrder: 0,
        }}
      />
    </div>
  );
}
