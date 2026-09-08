import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { QUALIFICATION_LABEL, coursePath, qualificationLevels } from "@/components/admin/course-meta";
import {
  destinationOptions,
  institutionOptions,
  listAdminCourses,
  listCourseCategories,
  PAGE_SIZE,
} from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "courses", "read");

  const params = await searchParams;
  const [{ rows, total, page }, institutions, categories, destinations] = await Promise.all([
    listAdminCourses({ ...params, page: Number(params.page ?? 1) }),
    institutionOptions(),
    listCourseCategories(),
    destinationOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Courses</h1>
        {can(actor, "courses", "create") ? (
          <>
            <Link className="admin-btn" href="/admin/courses/new">
              Add a course
            </Link>
            <Link className="admin-btn" href="/admin/courses/import">
              Import a spreadsheet
            </Link>
          </>
        ) : null}
      </div>

      <ContentFilters
        placeholder="Course name or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          {
            name: "institution",
            label: "Institution",
            anyLabel: "Any",
            options: institutions.map((row) => ({ value: row.id, label: row.name })),
          },
          {
            name: "category",
            label: "Subject area",
            anyLabel: "Any",
            options: categories.map((row) => ({ value: row.id, label: row.name })),
          },
          {
            name: "level",
            label: "Level",
            anyLabel: "Any",
            options: qualificationLevels.map((level) => ({ value: level, label: QUALIFICATION_LABEL[level] })),
          },
          {
            name: "destination",
            label: "Destination",
            anyLabel: "Any",
            options: destinations.map((row) => ({ value: row.id, label: row.name })),
          },
        ]}
      />
      <p className="t-small admin-count">{total} matching</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No courses match. Clear the filters, <Link href="/admin/courses/new">add a course</Link> or{" "}
          <Link href="/admin/courses/import">import a spreadsheet</Link>.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Institution</th>
              <th>Level</th>
              <th>Subject area</th>
              <th>Length</th>
              <th>Status</th>
              <th>On the site</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.institution ?? "Not set"}</td>
                <td>{row.qualificationLevel ? QUALIFICATION_LABEL[row.qualificationLevel] : "Not set"}</td>
                <td>{row.category ?? "Not set"}</td>
                <td>{row.durationLabel ?? "Not set"}</td>
                <td>{row.status}</td>
                <td>
                  <a href={coursePath(row.slug)} target="_blank" rel="noreferrer">
                    View on site
                  </a>
                </td>
                <td>
                  <Link className="admin-btn" href={`/admin/courses/${row.id}`}>
                    Edit
                  </Link>
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
