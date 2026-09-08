import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { formatDate, formatInOfficeTz } from "@/lib/datetime";
import { RegistrationFilters } from "@/components/admin/testprep-registration-filters";
import { RegistrationStatus } from "@/components/admin/testprep-registration-status";
import { batchOptions, listRegistrations, PAGE_SIZE } from "@/server/queries/admin-test-prep";

export const dynamic = "force-dynamic";

const STATUSES = ["registered", "attended", "cancelled"];

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "registrations", "read");

  const params = await searchParams;
  const [{ rows, total, page }, batches] = await Promise.all([
    listRegistrations(actor, { ...params, page: Number(params.page ?? 1) }),
    batchOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Test prep registrations</h1>
        <Link className="admin-btn" href="/admin/test-prep/batches">
          Batches
        </Link>
      </div>

      <RegistrationFilters
        batches={batches.map((b) => ({ id: b.id, label: `${b.courseName}: ${b.batchName}, ${formatDate(b.startDate)}` }))}
        statuses={STATUSES}
        exportPath="/admin/test-prep/registrations/export"
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nobody has registered for that. Widen the dates, or <Link href="/admin/test-prep/batches">check the batches</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Registered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.fullName}</td>
                <td>{row.email}</td>
                <td>{row.phone ?? "Not given"}</td>
                <td>{row.courseName}</td>
                <td>
                  <Link href={`/admin/test-prep/batches/${row.batchId}`}>{row.batchName}</Link>
                </td>
                <td>{formatInOfficeTz(row.createdAt, row.timezone ?? "Asia/Kathmandu")}</td>
                <td>
                  <RegistrationStatus id={row.id} status={row.status} />
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
