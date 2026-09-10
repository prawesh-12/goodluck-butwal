import { CalendarClock, Download } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import {
  DataCard,
  FlatBadge,
  Muted,
  Pager,
  ResultCount,
  StatusBadge,
  statusLabel,
} from "@/components/shared/admin/list-ui";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { ConfirmConsultation, ConsultationDetails } from "@/features/leads/components/consultation-details";
import { LeadFilters } from "@/features/leads/components/lead-filters";
import { dateLabel, timeLabel } from "@/features/leads/components/lead-format";
import { listConsultations, PAGE_SIZE, type LeadFilters as Filters } from "@/features/leads/queries";

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
  const filtered = Boolean(params.q || params.status || params.from || params.to);

  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => value && key !== "page") as [string, string][],
  ).toString();

  const exportCsv = (
    <Button variant="outline" asChild>
      <a href={`/api/admin/export/consultations${query ? `?${query}` : ""}`}>
        <Download />
        Export CSV
      </a>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Consultations"
        description="Consultation requests from the website."
        actions={exportCsv}
      />

      <LeadFilters
        searchPlaceholder="Search by name, email, phone or reference"
        fromLabel="Appointment from"
        toLabel="Appointment to"
        filters={[
          {
            name: "status",
            label: "Status",
            options: STATUSES.map((status) => ({ value: status, label: statusLabel(status) })),
          },
        ]}
      />

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={CalendarClock}
            title="No requests match your search"
            description="Try a different word, a wider date range, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No consultation requests yet"
            description="Requests people book on the website will arrive here."
          />
        )
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium">{row.fullName}</span>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-1 text-sm">
                  {dateLabel(row.preferredDate)} at {timeLabel(row.preferredTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[row.office, row.service].filter(Boolean).join(" · ") || "Office not set"}
                </p>
                {row.clashes ? (
                  <p className="mt-2">
                    <FlatBadge variant="warning">Another request wants this slot</FlatBadge>
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <ConsultationDetails row={row} />
                  {row.status === "pending" ? <ConfirmConsultation row={row} /> : null}
                </div>
              </li>
            ))}
          </ul>

          <DataCard className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Office</TableHead>
                  <TableHead className="hidden lg:table-cell">Service</TableHead>
                  <TableHead>Preferred date</TableHead>
                  <TableHead>Preferred time</TableHead>
                  <TableHead className="hidden xl:table-cell">Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.fullName}
                      {row.clashes ? (
                        <span className="mt-1 block">
                          <FlatBadge variant="warning">Another request wants this slot</FlatBadge>
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.office ? <FlatBadge>{row.office}</FlatBadge> : <Muted>Not set</Muted>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{row.service ?? <Muted>Not set</Muted>}</TableCell>
                    <TableCell className="whitespace-nowrap">{dateLabel(row.preferredDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{timeLabel(row.preferredTime)}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="block text-xs text-muted-foreground">{row.email}</span>
                      {row.phone ? (
                        <span className="block text-xs text-muted-foreground">{row.phone}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center justify-end gap-2">
                        <ConsultationDetails row={row} />
                        {row.status === "pending" ? <ConfirmConsultation row={row} /> : null}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataCard>
        </>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="requests" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </>
  );
}
