import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminCourses, PAGE_SIZE } from "@/server/queries/admin-test-prep";
import { TEST_LABEL } from "@/components/test-prep/schedule";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const TESTS = [
  { value: "ielts", label: "IELTS" },
  { value: "pte", label: "PTE" },
];

export default async function TestPrepListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "testPrep", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminCourses(actor, { ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Test preparation</h1>
        <Link className="admin-btn" href="/admin/test-prep/batches">
          Batches
        </Link>
        <Link className="admin-btn" href="/admin/test-prep/registrations">
          Registrations
        </Link>
        {can(actor, "testPrep", "create") ? (
          <Link className="admin-btn" href="/admin/test-prep/new">
            New course
          </Link>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Course or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "testType", label: "Test", anyLabel: "Any", options: TESTS },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No courses match. Clear the filters, or <Link href="/admin/test-prep/new">add a course</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Test</th>
              <th>Office</th>
              <th>Fee</th>
              <th>Status</th>
              <th>On the site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/test-prep/${row.id}`}>{row.name}</Link>
                </td>
                <td>{TEST_LABEL[row.testType]}</td>
                <td>{row.office ?? "Not set"}</td>
                <td>{row.fee ? `${row.feeCurrency} ${row.fee}` : "Not set"}</td>
                <td>{row.status}</td>
                <td>
                  <a href={`/test-preparation/${row.slug}`} target="_blank" rel="noreferrer">
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
