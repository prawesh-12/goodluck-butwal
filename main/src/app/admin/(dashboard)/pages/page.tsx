import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminPages, PAGE_SIZE } from "@/server/queries/admin-content";
import { pagePath } from "@/lib/validators/page";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function PagesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "pages", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminPages({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Pages</h1>
        {can(actor, "pages", "create") ? (
          <Link className="admin-btn" href="/admin/pages/new">
            New page
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Title or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          {
            name: "parent",
            label: "Section",
            anyLabel: "Any",
            options: [
              { value: "about", label: "About" },
              { value: "legal", label: "Legal" },
            ],
          },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No pages match. Clear the filters, or <Link href="/admin/pages/new">add a page</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Address</th>
              <th>Section</th>
              <th>In menu</th>
              <th>Status</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/pages/${row.id}`}>{row.title}</Link>
                </td>
                <td>{pagePath(row.parent, row.slug)}</td>
                <td>{row.parent}</td>
                <td>{row.showInNav ? "Yes" : "No"}</td>
                <td>{row.status}</td>
                <td>
                  <a href={pagePath(row.parent, row.slug)} target="_blank" rel="noreferrer">
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
