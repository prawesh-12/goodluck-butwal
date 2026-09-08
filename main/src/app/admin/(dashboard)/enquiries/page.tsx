import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { formatInOfficeTz } from "@/lib/datetime";
import { LeadFilters } from "@/components/admin/lead-filters";
import { listEnquiries, PAGE_SIZE, type LeadFilters as Filters } from "@/server/queries/leads";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "enquiries", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listEnquiries(actor, filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="t-h4">Enquiries</h1>
      <LeadFilters statuses={STATUSES} exportPath="/api/admin/export/enquiries" />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">Nothing matches those filters. Widen the dates or clear the search.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Email</th>
              <th>Office</th>
              <th>Status</th>
              <th>Received</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.reference}</td>
                <td>{row.fullName}</td>
                <td>{row.email}</td>
                <td>{row.office ?? "Not set"}</td>
                <td>{row.status.replace(/_/g, " ")}</td>
                <td>{formatInOfficeTz(row.createdAt, "Australia/Melbourne")}</td>
                <td>
                  <Link className="admin-btn" href={`/admin/enquiries/${row.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          {page > 1 ? <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link> : null}
          <span className="t-small">Page {page} of {pages}</span>
          {page < pages ? <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
