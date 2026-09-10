import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { getAdminPartner } from "@/features/partners/admin-queries";
import { pickedMedia } from "@/features/media/admin-queries";
import { PartnerEditor } from "@/features/partners/components/partner-editor";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "partners", "update");

  const row = await getAdminPartner((await params).id);
  if (!row) notFound();

  const media = await pickedMedia([row.logoId]);

  return (
    <>
      <EditorHeader
        backHref="/admin/partners"
        backLabel="Partners"
        title={row.name}
        meta={<StatusBadge status={row.status} />}
      />

      <PartnerEditor
        values={{
          id: row.id,
          name: row.name,
          logoId: row.logoId ?? "",
          websiteUrl: row.websiteUrl ?? "",
          isFeatured: row.isFeatured,
          status: row.status,
        }}
        logo={media[row.logoId ?? ""] ?? null}
        canPublish={can(actor, "partners", "publish")}
        canDelete={can(actor, "partners", "delete")}
      />
    </>
  );
}
