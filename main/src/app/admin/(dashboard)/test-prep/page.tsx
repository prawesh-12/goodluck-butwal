import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { ContentFilters } from "@/components/shared/admin/page-filters";
import { listAdminCourses, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { TEST_LABEL } from "@/features/test-prep/schedule";
import { Button } from "@/components/ui/admin/button";
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
    <div className="space-y-4">
      <ListHeader
        title="Test preparation"
        count={total}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/test-prep/batches">Batches</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/test-prep/registrations">Registrations</Link>
            </Button>
            {can(actor, "testPrep", "create") ? (
              <NewButton href="/admin/test-prep/new">New course</NewButton>
            ) : null}
          </>
        }
      />

      <ContentFilters
        placeholder="Course or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "testType", label: "Test", anyLabel: "Any", options: TESTS },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>
          No courses match. Clear the filters, or <Link href="/admin/test-prep/new">add a course</Link>.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Fee</TableHead>
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
                <TableCell>
                  <FlatBadge variant="outline">{TEST_LABEL[row.testType]}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>{row.fee ? `${row.feeCurrency} ${row.fee}` : "Not set"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={`/test-preparation/${row.slug}`} />
                    <EditLink href={`/admin/test-prep/${row.id}`} />
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
