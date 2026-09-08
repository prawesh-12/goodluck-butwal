import Link from "next/link";
import { Fragment } from "react";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/datetime";
import { seatLabel } from "@/lib/seats";
import { ContentFilters } from "@/components/admin/page-filters";
import { classTime, MODE_LABEL, scheduleDays } from "@/components/test-prep/schedule";
import { courseOptions, listAdminBatches, PAGE_SIZE } from "@/server/queries/admin-test-prep";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "filling_fast", label: "Filling fast" },
  { value: "full", label: "Full" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
];

const MODES = [
  { value: "in_person", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export default async function BatchesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "batches", "read");

  const params = await searchParams;
  const [{ rows, total, page }, courses] = await Promise.all([
    listAdminBatches(actor, { ...params, page: Number(params.page ?? 1) }),
    courseOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Batches</h1>
        <Link className="admin-btn" href="/admin/test-prep">
          Courses
        </Link>
        {can(actor, "batches", "create") ? (
          <Link className="admin-btn" href="/admin/test-prep/batches/new">
            New batch
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Batch name"
        selects={[
          { name: "course", label: "Course", anyLabel: "Every course", options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "mode", label: "Mode", anyLabel: "Any", options: MODES },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No batches match. Clear the filters, or <Link href="/admin/test-prep/batches/new">add a batch</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Starts</th>
              <th>Days</th>
              <th>Time</th>
              <th>Mode</th>
              <th>Trainer</th>
              <th>Seats</th>
              <th>Shows as</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Fragment key={row.id}>
                {i === 0 || rows[i - 1].courseId !== row.courseId ? (
                  <tr>
                    <th colSpan={9}>{row.courseName}</th>
                  </tr>
                ) : null}
                <tr>
                  <td>
                    <Link href={`/admin/test-prep/batches/${row.id}`}>{row.batchName}</Link>
                  </td>
                  <td>{formatDate(row.startDate)}</td>
                  <td>{scheduleDays(row.scheduleDays)}</td>
                  <td>{classTime(row.startTime, row.endTime, row.timezone ?? "Asia/Kathmandu")}</td>
                  <td>{MODE_LABEL[row.mode]}</td>
                  <td>{row.trainer ?? "Not decided"}</td>
                  <td>
                    {row.seatsTaken} of {row.totalSeats}
                  </td>
                  <td>{seatLabel(row)}</td>
                  <td>
                    <a href={`/test-preparation/${row.courseSlug}`} target="_blank" rel="noreferrer">
                      View on site
                    </a>
                  </td>
                </tr>
              </Fragment>
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
