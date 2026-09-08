import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminDestinations, PAGE_SIZE } from "@/server/queries/admin-content";
import { destinationPath } from "@/lib/validators/destination";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function DestinationsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "destinations", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminDestinations({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Destinations</h1>
        {can(actor, "destinations", "create") ? (
          <Link className="admin-btn" href="/admin/destinations/new">
            New destination
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Country or address"
        selects={[{ name: "status", label: "Status", anyLabel: "Any", options: STATUSES }]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No destinations match. Clear the filters, or <Link href="/admin/destinations/new">add a destination</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Address</th>
              <th>Has a page</th>
              <th>Featured</th>
              <th>Status</th>
              <th>Questions</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/destinations/${row.id}`}>{row.name}</Link>
                </td>
                <td>{destinationPath(row.slug)}</td>
                <td>{row.hasPage ? "Yes" : "No"}</td>
                <td>{row.isFeatured ? "Yes" : "No"}</td>
                <td>{row.status}</td>
                <td>
                  <Link href={`/admin/destinations/${row.id}/faqs`}>Questions</Link>
                </td>
                <td>
                  <a href={destinationPath(row.slug)} target="_blank" rel="noreferrer">
                    View on site
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          {page > 1 ? <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link> : null}
          <span className="t-small">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
