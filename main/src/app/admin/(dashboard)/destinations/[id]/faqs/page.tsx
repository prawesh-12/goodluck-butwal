import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { FaqEditor } from "@/components/shared/admin/repeater-faqs";
import { getAdminDestination, listDestinationFaqs } from "@/features/destinations/admin-queries";
import { saveDestinationFaqs } from "@/features/destinations/actions";
import { destinationPath } from "@/features/destinations/validators";

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
