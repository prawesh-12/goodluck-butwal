import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminServices, PAGE_SIZE } from "@/server/queries/admin-content";
import { servicePath } from "@/lib/validators/service";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SCOPES = [
  { value: "both", label: "Both offices" },
  { value: "au", label: "Australia only" },
  { value: "np", label: "Nepal only" },
];

export default async function ServicesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "services", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminServices({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Services</h1>
        {can(actor, "services", "create") ? (
          <Link className="admin-btn" href="/admin/services/new">
            New service
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Service or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "scope", label: "Office", anyLabel: "Any", options: SCOPES },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No services match. Clear the filters, or <Link href="/admin/services/new">add a service</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Address</th>
              <th>Category</th>
              <th>Office</th>
              <th>Card colour</th>
              <th>Status</th>
              <th>Questions</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/services/${row.id}`}>{row.name}</Link>
                </td>
                <td>{servicePath(row.slug)}</td>
                <td>{row.category.replace(/_/g, " ")}</td>
                <td>{row.officeScope}</td>
                <td>{row.tone ?? "Not set"}</td>
                <td>{row.status}</td>
                <td>
                  <Link href={`/admin/services/${row.id}/faqs`}>Questions</Link>
                </td>
                <td>
                  <a href={servicePath(row.slug)} target="_blank" rel="noreferrer">
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
