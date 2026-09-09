import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { ContentFilters } from "@/components/shared/admin/page-filters";
import { QUALIFICATION_LABEL, coursePath, qualificationLevels } from "@/config/course-meta";
import { destinationOptions, listAdminCourses, listCourseCategories } from "@/features/courses/admin-queries";
import { institutionOptions } from "@/features/institutions/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

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
    <div className="space-y-4">
      <ListHeader
        title="Courses"
        count={total}
        actions={
          can(actor, "courses", "create") ? (
            <>
              <NewButton href="/admin/courses/new">Add a course</NewButton>
              <NewButton href="/admin/courses/import">Import a spreadsheet</NewButton>
            </>
          ) : null
        }
      />

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

      {rows.length === 0 ? (
        <EmptyState>No courses match. Clear the filters, add a course or import a spreadsheet.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Subject area</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.name}</span>
                </TableCell>
                <TableCell>{row.institution ?? "Not set"}</TableCell>
                <TableCell>
                  <FlatBadge variant="outline">
                    {row.qualificationLevel ? QUALIFICATION_LABEL[row.qualificationLevel] : "Not set"}
                  </FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge variant="outline">{row.category ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>{row.durationLabel ?? "Not set"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={coursePath(row.slug)} />
                    <EditLink href={`/admin/courses/${row.id}`} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
