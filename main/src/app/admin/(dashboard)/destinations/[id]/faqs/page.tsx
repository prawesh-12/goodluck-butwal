import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { FaqEditor } from "@/components/admin/repeater-faqs";
import { getAdminDestination, listDestinationFaqs } from "@/server/queries/admin-content";
import { saveDestinationFaqs } from "@/server/actions/destinations";
import { destinationPath } from "@/lib/validators/destination";

export const dynamic = "force-dynamic";

export default async function DestinationFaqsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "destinations", "update");

  const row = await getAdminDestination((await params).id);
  if (!row) notFound();

  const rows = await listDestinationFaqs(row.id);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name} questions</h1>
        <Link className="admin-btn" href={`/admin/destinations/${row.id}`}>
          Back to the destination
        </Link>
      </div>
      <p className="t-small admin-count">{rows.length} questions</p>

      <FaqEditor
        ownerId={row.id}
        ownerName={row.name}
        viewHref={destinationPath(row.slug)}
        rows={rows}
        save={saveDestinationFaqs}
      />
    </>
  );
}
