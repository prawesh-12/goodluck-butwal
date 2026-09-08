import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";
import { testimonialTypes } from "@/lib/validators/testimonial";
import { EditorialFilters } from "@/components/admin/editor-filters";
import { officeOptions } from "@/server/queries/admin-people";
import {
  listAdminTestimonials,
  PAGE_SIZE,
  type EditorialFilters as Filters,
} from "@/server/queries/admin-editorial";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "testimonials", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, offices] = await Promise.all([
    listAdminTestimonials(actor, filters),
    actor.role === "super_admin" ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="t-h4">Testimonials</h1>

      <EditorialFilters
        placeholder="Name or words in the quote"
        selects={[
          {
            name: "status",
            label: "Status",
            options: contentStatuses.map((status) => ({ value: status, label: status })),
          },
          {
            name: "type",
            label: "Kind",
            options: testimonialTypes.map((type) => ({ value: type, label: type })),
          },
          ...(offices.length > 0
            ? [
                {
                  name: "office",
                  label: "Office",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      <div className="admin-actions">
        <p className="t-small admin-count">{total} matching</p>
        {can(actor, "testimonials", "create") ? (
          <Link className="btn-black-sm" href="/admin/testimonials/new">
            Add a story
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nothing matches those filters. Clear the search, or add a story.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Shown as</th>
              <th>Kind</th>
              <th>Office</th>
              <th>Status</th>
              <th>Consent</th>
              <th>Live page</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/testimonials/${row.id}`}>
                    {row.displayName || "No name yet"}
                  </Link>
                  {row.isAnonymised ? <span className="admin-clash">anonymised</span> : null}
                </td>
                <td>{row.type}</td>
                <td>{row.office ?? "Both"}</td>
                <td>{row.status}</td>
                <td>{row.consentGiven ? "Recorded" : "Not recorded"}</td>
                <td>
                  <a href="/success-stories" target="_blank" rel="noreferrer">
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
