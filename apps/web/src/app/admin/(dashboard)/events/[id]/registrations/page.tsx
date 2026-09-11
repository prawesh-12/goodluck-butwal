import { notFound } from "next/navigation";
import { Download, Users } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { EmptyState, ErrorState } from "@/components/shared/admin/states";
import {
  getAdminEvent,
  listEventRegistrations,
  officeTimezone,
  PAGE_SIZE,
  type EventFilters,
} from "@/features/events/admin-queries";
import { seatsTaken } from "@/features/events/queries";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { DataCard, Muted, Pager, ResultCount, RowAvatar, StatusBadge } from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function EventRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "registrations", "read");

  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) notFound();
  allowOwn(actor, event);

  const query = await searchParams;
  const filters: EventFilters = { ...query, event: id, page: Number(query.page ?? 1) };
  const [{ rows, total, page }, taken, zone] = await Promise.all([
    listEventRegistrations(actor, filters),
    seatsTaken(id),
    officeTimezone(event.officeId),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // The download runs the search that is on screen, so it never reaches further than the list.
  const download = new URLSearchParams({ event: event.id, ...(query.q ? { q: query.q } : {}) });

  const capacity = event.capacity;
  const left = capacity === null ? null : capacity - taken;
  const warning =
    capacity === null || left === null
      ? null
      : left < 0
        ? `Over capacity. ${taken} seats taken against ${capacity}.`
        : left === 0
          ? `Full. All ${capacity} seats are taken, so the form is turning people away.`
          : left <= Math.max(1, Math.round(capacity * 0.1))
            ? `Nearly full. ${left} of ${capacity} seats left.`
            : null;

  return (
    <div className="space-y-6">
      <EditorHeader
        backHref={`/admin/events/${event.id}`}
        backLabel={event.title}
        title="Registrations"
        meta={
          <Muted>
            Starts {formatInOfficeTz(event.startsAt, zone)} · {taken} seats taken
            {capacity === null ? ", no limit set" : ` of ${capacity}`}
          </Muted>
        }
        actions={
          can(actor, "registrations", "export") ? (
            <Button variant="outline" nativeButton={false} render={<a href={`/api/admin/export/event-registrations?${download}`} />}>
                <Download />
                Download CSV
              </Button>
          ) : null
        }
      />

      {warning ? <ErrorState title={warning} /> : null}

      <FilterBar searchPlaceholder="Search by name, email or phone" />

      {rows.length === 0 ? (
        query.q ? (
          <EmptyState icon={Users} title="Nobody matches" description="Clear the search to see everybody." />
        ) : (
          <EmptyState
            icon={Users}
            title="Nobody has registered yet"
            description="Share the event page to start taking registrations."
          />
        )
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Coming</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
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
                  <TableCell>{row.attendees}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatInOfficeTz(row.createdAt, zone)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="max-w-64 text-muted-foreground">{row.notes ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="registrations" />
        <Pager page={page} pages={pages} params={query} />
      </div>
    </div>
  );
}
