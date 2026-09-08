import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { InstitutionPartnerLink } from "@/components/admin/institution-partner-link";
import { institutionPath } from "@/components/admin/course-meta";
import {
  coursesPerInstitution,
  destinationOptions,
  listAdminInstitutions,
  PAGE_SIZE,
} from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function InstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "institutions", "read");

  const params = await searchParams;
  const [{ rows, total, page }, destinations, counts] = await Promise.all([
    listAdminInstitutions({ ...params, page: Number(params.page ?? 1) }),
    destinationOptions(),
    coursesPerInstitution(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Institutions</h1>
        {can(actor, "institutions", "create") ? (
          <Link className="admin-btn" href="/admin/institutions/new">
            Add an institution
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Name, address or country"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          {
            name: "destination",
            label: "Destination",
            anyLabel: "Any",
            options: destinations.map((destination) => ({ value: destination.id, label: destination.name })),
          },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No institutions match. Clear the filters, or{" "}
          <Link href="/admin/institutions/new">add an institution</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Destination</th>
              <th>Country</th>
              <th>Courses</th>
              <th>Partner</th>
              <th>Featured</th>
              <th>Status</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/institutions/${row.id}`}>{row.name}</Link>
                </td>
                <td>{row.destination ?? "Not set"}</td>
                <td>{row.country ?? "Not set"}</td>
                <td>{counts.get(row.id) ?? 0}</td>
                <td>{row.isPartner ? "Yes" : "No"}</td>
                <td>{row.isFeatured ? "Yes" : "No"}</td>
                <td>{row.status}</td>
                <td>
                  <a href={institutionPath(row.slug)} target="_blank" rel="noreferrer">
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

      {can(actor, "institutions", "update") && can(actor, "partners", "update") ? (
        <InstitutionPartnerLink />
      ) : null}
    </>
  );
}
