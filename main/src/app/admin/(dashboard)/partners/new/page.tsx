import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PartnerEditor } from "@/features/partners/components/partner-editor";

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
