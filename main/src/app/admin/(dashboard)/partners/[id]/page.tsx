import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
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
        logo={media[row.logoId ?? ""] ?? null}
        canPublish={can(actor, "partners", "publish")}
        canDelete={can(actor, "partners", "delete")}
      />
    </>
  );
}
