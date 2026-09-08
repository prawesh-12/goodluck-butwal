import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { PartnerEditor } from "@/components/admin/partner-editor";

export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  const actor = await requireActor();
  allow(actor, "partners", "create");

  return (
    <>
      <h1 className="t-h4">Add a partner</h1>

      <PartnerEditor
        values={{ id: "", name: "", websiteUrl: "", isFeatured: false, status: "draft" }}
        logo={null}
        canPublish={can(actor, "partners", "publish")}
        canDelete={false}
      />
    </>
  );
}
