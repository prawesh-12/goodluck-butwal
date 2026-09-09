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
import { Button } from "@/components/admin/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  RowAvatar,
  StatusBadge,
  ViewSiteLink,
} from "@/components/admin/list-ui";

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
    <div className="space-y-4">
      <ListHeader
        title="Batches"
        count={total}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/test-prep">Courses</Link>
            </Button>
            {can(actor, "batches", "create") ? (
              <NewButton href="/admin/test-prep/batches/new">New batch</NewButton>
            ) : null}
          </>
        }
      />

      <ContentFilters
        placeholder="Batch name"
        selects={[
          { name: "course", label: "Course", anyLabel: "Every course", options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "mode", label: "Mode", anyLabel: "Any", options: MODES },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>
          No batches match. Clear the filters, or <Link href="/admin/test-prep/batches/new">add a batch</Link>.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Shows as</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <Fragment key={row.id}>
                {i === 0 || rows[i - 1].courseId !== row.courseId ? (
                  <TableRow>
                    <TableCell colSpan={8} className="font-medium">
                      {row.courseName}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center justify-end gap-1">
                        <EditLink href={`/admin/test-prep/batches/${row.id}`} />
                      </span>
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow>
                  <TableCell>
                    <span className="font-medium">{row.batchName}</span>
                  </TableCell>
                  <TableCell>{formatDate(row.startDate)}</TableCell>
                  <TableCell>{scheduleDays(row.scheduleDays)}</TableCell>
                  <TableCell>{classTime(row.startTime, row.endTime, row.timezone ?? "Asia/Kathmandu")}</TableCell>
                  <TableCell>
                    <FlatBadge variant="outline">{MODE_LABEL[row.mode]}</FlatBadge>
                  </TableCell>
                  <TableCell>
                    {row.trainer ? (
                      <span className="flex items-center gap-2.5">
                        <RowAvatar name={row.trainer} />
                        {row.trainer}
                      </span>
                    ) : (
                      "Not decided"
                    )}
                  </TableCell>
                  <TableCell>
                    {row.seatsTaken} of {row.totalSeats}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={seatLabel(row)} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      <ViewSiteLink href={`/test-preparation/${row.courseSlug}`} />
                    </span>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
