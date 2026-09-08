import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { ContentFilters } from "@/components/admin/content-filters";
import { listAdminOffices, PAGE_SIZE, type AdminFilters } from "@/server/queries/admin-people";

export const dynamic = "force-dynamic";

export default async function OfficesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "offices", "read");

  const params = await searchParams;
  const filters: AdminFilters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listAdminOffices(actor, filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="t-h4">Offices</h1>
      <p className="t-small admin-help">
        The offices are fixed. You can change their details, but not add or remove one.
      </p>

      <ContentFilters placeholder="Office, city or country" />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nothing matches those filters. Clear the search to see your office.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Office</th>
              <th>City</th>
              <th>Phone</th>
              <th>Status</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/offices/${row.id}`}>{row.name}</Link>
                </td>
                <td>{row.city ?? "Not set"}</td>
                <td>{row.phoneDisplay ?? "Not set"}</td>
                <td>
                  {row.status}
                  {row.isActive ? "" : ", temporarily closed"}
                </td>
                <td>
                  <a href="/contact" target="_blank" rel="noreferrer">
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
          {page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link>
          ) : null}
          <span className="t-small">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
