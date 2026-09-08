import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { getAdminPartner, pickedMedia } from "@/server/queries/admin-people";
import { PartnerEditor } from "@/components/admin/partner-editor";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "partners", "update");

  const row = await getAdminPartner((await params).id);
  if (!row) notFound();

  const media = await pickedMedia([row.logoId]);

  return (
    <>
      <h1 className="t-h4">{row.name}</h1>
      <p className="t-small admin-help">
        <a href="/" target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <PartnerEditor
        values={{
          id: row.id,
          name: row.name,
          websiteUrl: row.websiteUrl ?? "",
          isFeatured: row.isFeatured,
          status: row.status,
        }}
        logo={media.get(row.logoId ?? "") ?? null}
        canPublish={can(actor, "partners", "publish")}
        canDelete={can(actor, "partners", "delete")}
      />
    </>
  );
}
