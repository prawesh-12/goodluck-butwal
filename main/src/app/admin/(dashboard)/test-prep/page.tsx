import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { TestPrepTabs } from "@/features/test-prep/components/section-tabs";
import { listAdminCourses, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { TEST_LABEL } from "@/features/test-prep/schedule";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  NewButton,
  Pager,
  ResultCount,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
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
  const filtered = Boolean(params.q || params.status || params.testType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test preparation"
        description="IELTS and PTE courses, their classes, and who has signed up."
        actions={can(actor, "testPrep", "create") ? <NewButton href="/admin/test-prep/new">New course</NewButton> : null}
      />

      <TestPrepTabs active="courses">
        <div className="space-y-4">
          <FilterBar
            searchPlaceholder="Search courses"
            filters={[
              { name: "status", label: "Status", anyLabel: "Any status", options: STATUSES },
              { name: "testType", label: "Test", anyLabel: "Both tests", options: TESTS },
            ]}
          />

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={GraduationCap}
                title="No courses match"
                description="Clear the search and filters to see every course."
              />
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No courses yet"
                description="Add an IELTS or PTE course, then give it the classes people can join."
                action={
                  can(actor, "testPrep", "create") ? (
                    <NewButton href="/admin/test-prep/new">New course</NewButton>
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
                    <TableHead>Classes</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{row.name}</span>
                          <FlatBadge variant="outline">{TEST_LABEL[row.testType]}</FlatBadge>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="link" size="sm" asChild className="h-auto px-0">
                          <Link href={`/admin/test-prep/batches?course=${row.id}`}>See the batches</Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {row.fee ? `${row.feeCurrency} ${row.fee}` : <Muted>Not set</Muted>}
                      </TableCell>
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
            </DataCard>
          )}

          <div className="flex items-center justify-between gap-4">
            <ResultCount shown={rows.length} total={total} noun="courses" />
            <Pager page={page} pages={pages} params={params} />
          </div>
        </div>
      </TestPrepTabs>
    </div>
  );
}
