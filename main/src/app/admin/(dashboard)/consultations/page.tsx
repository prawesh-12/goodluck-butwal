import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { LeadFilters } from "@/components/admin/lead-filters";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { listConsultations, PAGE_SIZE, type LeadFilters as Filters } from "@/server/queries/leads";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { EmptyState, FlatBadge, ListHeader, Pager, RowAvatar, StatusBadge } from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "consultations", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listConsultations(actor, filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader title="Consultations" count={total} />
      <LeadFilters statuses={STATUSES} exportPath="/api/admin/export/consultations" />

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Widen the dates or clear the search.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Asked for</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.reference}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.fullName} />
                    <span>
                      <span className="font-medium">{row.fullName}</span>
                      <br />
                      <span className="t-small">{row.email}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  {row.preferredDate} {row.preferredTime?.slice(0, 5)}
                  {row.clashes ? <span className="admin-clash">Two requests at this time</span> : null}
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>{row.service ?? ""}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    {row.status === "pending" ? <ConfirmButton id={row.id} /> : null}
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
