import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { FaqEditor } from "@/components/admin/repeater-faqs";
import { getAdminService, listServiceFaqs } from "@/server/queries/admin-content";
import { saveServiceFaqs } from "@/server/actions/services";
import { servicePath } from "@/lib/validators/service";

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
        <Link className="btn-black-sm" href={`/admin/services/${row.id}`}>
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
