import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { formatDate, formatInOfficeTz } from "@/lib/utils/datetime";
import { RegistrationFilters } from "@/features/test-prep/components/registration-filters";
import { RegistrationStatus } from "@/features/test-prep/components/registration-status";
import { batchOptions, listRegistrations, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { EmptyState, ListHeader, Pager, RowAvatar } from "@/components/shared/admin/list-ui";

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
    <div className="space-y-4">
      <ListHeader
        title="Test prep registrations"
        count={total}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/test-prep/batches">Batches</Link>
          </Button>
        }
      />

      <RegistrationFilters
        batches={batches.map((b) => ({ id: b.id, label: `${b.courseName}: ${b.batchName}, ${formatDate(b.startDate)}` }))}
        statuses={STATUSES}
        exportPath="/admin/test-prep/registrations/export"
      />

      {rows.length === 0 ? (
        <EmptyState>
          Nobody has registered for that. Widen the dates, or <Link href="/admin/test-prep/batches">check the batches</Link>.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
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
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.fullName} />
                    <span className="font-medium">{row.fullName}</span>
                  </span>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.phone ?? "Not given"}</TableCell>
                <TableCell>{row.courseName}</TableCell>
                <TableCell>
                  <Link href={`/admin/test-prep/batches/${row.batchId}`}>{row.batchName}</Link>
                </TableCell>
                <TableCell>{formatInOfficeTz(row.createdAt, row.timezone ?? "Asia/Kathmandu")}</TableCell>
                <TableCell>
                  <RegistrationStatus id={row.id} status={row.status} />
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
