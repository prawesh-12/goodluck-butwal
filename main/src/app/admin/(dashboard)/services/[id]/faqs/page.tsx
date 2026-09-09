import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { FaqEditor } from "@/components/shared/admin/repeater-faqs";
import { getAdminService, listServiceFaqs } from "@/features/services/admin-queries";
import { saveServiceFaqs } from "@/features/services/actions";
import { servicePath } from "@/features/services/validators";

export const dynamic = "force-dynamic";

export default async function ServiceFaqsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "services", "update");

  const row = await getAdminService((await params).id);
  if (!row) notFound();

  const rows = await listServiceFaqs(row.id);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name} questions</h1>
        <Link className="admin-btn" href={`/admin/services/${row.id}`}>
          Back to the service
        </Link>
      </div>
      <p className="t-small admin-count">{rows.length} questions</p>

      <FaqEditor
        ownerId={row.id}
        ownerName={row.name}
        viewHref={servicePath(row.slug)}
        rows={rows}
        save={saveServiceFaqs}
      />
    </>
  );
}
