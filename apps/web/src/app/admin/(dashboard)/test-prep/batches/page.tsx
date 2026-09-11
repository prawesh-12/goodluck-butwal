import { CalendarDays } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/datetime";
import { seatLabel } from "@/features/test-prep/seats";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { TestPrepTabs } from "@/features/test-prep/components/section-tabs";
import { classTime, MODE_LABEL, scheduleDays } from "@/features/test-prep/schedule";
import { courseOptions, listAdminBatches, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  NewButton,
  Pager,
  ResultCount,
  RowAvatar,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

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
  const filtered = Boolean(params.q || params.course || params.status || params.mode);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test preparation"
        description="IELTS and PTE courses, their classes, and who has signed up."
        actions={
          can(actor, "batches", "create") ? (
            <NewButton href="/admin/test-prep/batches/new">New batch</NewButton>
          ) : null
        }
      />

      <TestPrepTabs active="batches">
        <div className="space-y-4">
          <FilterBar
            searchPlaceholder="Search batches"
            filters={[
              {
                name: "course",
                label: "Course",
                anyLabel: "Every course",
                options: courses.map((course) => ({ value: course.id, label: course.name })),
              },
              { name: "status", label: "Status", anyLabel: "Any status", options: STATUSES },
              { name: "mode", label: "Taught", anyLabel: "Any way", options: MODES },
            ]}
          />

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={CalendarDays}
                title="No batches match"
                description="Clear the search and filters to see every batch."
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No batches yet"
                description="A batch is one run of a course, with its own dates, trainer and seats."
                action={
                  can(actor, "batches", "create") ? (
                    <NewButton href="/admin/test-prep/batches/new">New batch</NewButton>
                  ) : null
                }
              />
            )
          ) : (
            <DataCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.courseName}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {row.batchName}
                          <FlatBadge variant="outline">{MODE_LABEL[row.mode]}</FlatBadge>
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="block">
                          {formatDate(row.startDate)}
                          {row.endDate ? ` to ${formatDate(row.endDate)}` : ""}
                        </span>
                        <Muted>{scheduleDays(row.scheduleDays)}</Muted>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {classTime(row.startTime, row.endTime, row.timezone ?? "Asia/Kathmandu")}
                      </TableCell>
                      <TableCell>
                        {row.trainer ? (
                          <span className="flex items-center gap-2.5 whitespace-nowrap">
                            <RowAvatar name={row.trainer} />
                            {row.trainer}
                          </span>
                        ) : (
                          <Muted>Not decided</Muted>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.fee ? `${row.feeCurrency} ${row.fee}` : <Muted>Course fee</Muted>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="block">
                          {row.seatsTaken} of {row.totalSeats} taken
                        </span>
                        <StatusBadge status={seatLabel(row).toLowerCase().replace(/ /g, "_")} />
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center justify-end gap-1">
                          <ViewSiteLink href={`/test-preparation/${row.courseSlug}`} />
                          <EditLink href={`/admin/test-prep/batches/${row.id}`} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataCard>
          )}

          <div className="flex items-center justify-between gap-4">
            <ResultCount shown={rows.length} total={total} noun="batches" />
            <Pager page={page} pages={pages} params={params} />
          </div>
        </div>
      </TestPrepTabs>
    </div>
  );
}
