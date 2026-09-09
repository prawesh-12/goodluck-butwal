import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { formatInOfficeTz } from "@/lib/datetime";
import { LeadFilters } from "@/components/admin/lead-filters";
import { listEnquiries, listServiceOptions, PAGE_SIZE, type LeadFilters as Filters } from "@/server/queries/leads";
import { Button } from "@/components/admin/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { StatusBadge } from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "enquiries", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, services] = await Promise.all([
    listEnquiries(actor, filters),
    listServiceOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="text-sm text-muted-foreground">{total} matching</p>
      </div>
      <LeadFilters statuses={STATUSES} services={services} exportPath="/api/admin/export/enquiries" />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing matches those filters. Widen the dates or clear the search.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.office ?? "Not set"}</TableCell>
                <TableCell>{row.service ?? "Not set"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>{formatInOfficeTz(row.createdAt, "Australia/Melbourne")}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/enquiries/${row.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pages > 1 ? (
        <nav className="flex items-center gap-3">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link>
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          {page < pages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
