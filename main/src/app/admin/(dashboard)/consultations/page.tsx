import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { LeadFilters } from "@/components/admin/lead-filters";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { listConsultations, PAGE_SIZE, type LeadFilters as Filters } from "@/server/queries/leads";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "consultations", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listConsultations(actor, filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="t-h4">Consultations</h1>
      <LeadFilters statuses={STATUSES} exportPath="/api/admin/export/consultations" />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">Nothing matches those filters. Widen the dates or clear the search.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Asked for</th>
              <th>Office</th>
              <th>Service</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.reference}</td>
                <td>
                  {row.fullName}
                  <br />
                  <span className="t-small">{row.email}</span>
                </td>
                <td>
                  {row.preferredDate} {row.preferredTime?.slice(0, 5)}
                  {row.clashes ? <span className="admin-clash">Two requests at this time</span> : null}
                </td>
                <td>{row.office ?? "Not set"}</td>
                <td>{row.service ?? ""}</td>
                <td>{row.status.replace(/_/g, " ")}</td>
                <td>{row.status === "pending" ? <ConfirmButton id={row.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          <span className="t-small">Page {page} of {pages}</span>
        </nav>
      ) : null}
    </>
  );
}
