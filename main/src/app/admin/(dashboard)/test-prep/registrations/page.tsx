import Link from "next/link";
import { Download, Users } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { formatDate, formatInOfficeTz } from "@/lib/utils/datetime";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { TestPrepTabs } from "@/features/test-prep/components/section-tabs";
import { RegistrationFilters } from "@/features/test-prep/components/registration-filters";
import { RegistrationStatus } from "@/features/test-prep/components/registration-status";
import { batchOptions, listRegistrations, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { DataCard, Muted, Pager, ResultCount, RowAvatar } from "@/components/shared/admin/list-ui";

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
  const filtered = Boolean(params.q || params.batch || params.status || params.from || params.to);

  // The download runs the filters that are on screen, so it never reaches further than the list.
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== "page" && value) as [string, string][],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test preparation"
        description="IELTS and PTE courses, their classes, and who has signed up."
        actions={
          can(actor, "registrations", "export") ? (
            <Button variant="outline" asChild>
              <a href={`/admin/test-prep/registrations/export?${query}`}>
                <Download />
                Download CSV
              </a>
            </Button>
          ) : null
        }
      />

      <TestPrepTabs active="registrations">
        <div className="space-y-4">
          <RegistrationFilters
            batches={batches.map((batch) => ({
              id: batch.id,
              label: `${batch.courseName}: ${batch.batchName}, ${formatDate(batch.startDate)}`,
            }))}
            statuses={STATUSES}
          />

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={Users}
                title="No registrations match"
                description="Clear the search, the dates and the filters to see everybody."
              />
            ) : (
              <EmptyState
                icon={Users}
                title="Nobody has registered yet"
                description="People who sign up for a batch on the website land here."
              />
            )
          ) : (
            <DataCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="flex items-center gap-2.5 whitespace-nowrap">
                          <RowAvatar name={row.fullName} />
                          <span className="font-medium">{row.fullName}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${row.email}`} className="block hover:underline">
                          {row.email}
                        </a>
                        {row.phone ? <Muted>{row.phone}</Muted> : null}
                      </TableCell>
                      <TableCell>{row.courseName}</TableCell>
                      <TableCell>
                        <Button variant="link" size="sm" asChild className="h-auto px-0">
                          <Link href={`/admin/test-prep/batches/${row.batchId}`}>{row.batchName}</Link>
                        </Button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatInOfficeTz(row.createdAt, row.timezone ?? "Asia/Kathmandu")}
                      </TableCell>
                      <TableCell>
                        <RegistrationStatus id={row.id} status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataCard>
          )}

          <div className="flex items-center justify-between gap-4">
            <ResultCount shown={rows.length} total={total} noun="registrations" />
            <Pager page={page} pages={pages} params={params} />
          </div>
        </div>
      </TestPrepTabs>
    </div>
  );
}
