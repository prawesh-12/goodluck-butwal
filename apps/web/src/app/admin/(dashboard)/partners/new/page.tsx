import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { PartnerEditor } from "@/features/partners/components/partner-editor";

export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  const actor = await requireActor();
  allow(actor, "partners", "create");

  return (
    <>
      <EditorHeader backHref="/admin/partners" backLabel="Partners" title="Add partner" />

      <PartnerEditor
        values={{ id: "", name: "", logoId: "", websiteUrl: "", isFeatured: false, status: "draft" }}
        logo={null}
        canPublish={can(actor, "partners", "publish")}
        canDelete={false}
      />
    </>
  );
}
