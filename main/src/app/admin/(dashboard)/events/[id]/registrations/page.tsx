import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { formatInOfficeTz } from "@/lib/datetime";
import {
  getAdminEvent,
  listEventRegistrations,
  officeTimezone,
  PAGE_SIZE,
  type EventFilters,
} from "@/server/queries/admin-events";
import { seatsTaken } from "@/server/queries/events";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { EmptyState, ListHeader, NewButton, Pager, RowAvatar, StatusBadge } from "@/components/admin/list-ui";

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
    <div className="space-y-4">
      <h1 className="t-h4">Registrations for {event.title}</h1>
      <p className="t-small admin-help">
        <Link href={`/admin/events/${event.id}`}>Back to the event</Link> · starts{" "}
        {formatInOfficeTz(event.startsAt, zone)}
      </p>
      <ListHeader
        title="Registrations"
        count={total}
        countNoun={`registered, ${taken} seats taken${capacity === null ? ", no limit set" : ` of ${capacity}`}`}
        actions={
          can(actor, "registrations", "export") ? (
            <NewButton href={`/api/admin/export/event-registrations?event=${event.id}`}>Download CSV</NewButton>
          ) : null
        }
      />

      {warning ? <p className="t-body admin-clash">{warning}</p> : null}

      {rows.length === 0 ? (
        <EmptyState>Nobody has registered yet. Share the event page to start taking registrations.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
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
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.fullName} />
                    <span className="font-medium">{row.fullName}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                </TableCell>
                <TableCell>{row.phone ?? ""}</TableCell>
                <TableCell>{row.attendees}</TableCell>
                <TableCell>{formatInOfficeTz(row.createdAt, zone)}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.notes ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager page={page} pages={pages} params={query} />
    </div>
  );
}
