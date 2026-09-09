import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";
import { eventTypeLabels, eventTypes } from "@/lib/content-meta";
import { formatInOfficeTz } from "@/lib/datetime";
import { EditorialFilters } from "@/components/admin/editor-filters";
import { officeOptions } from "@/server/queries/admin-people";
import { listAdminEvents, PAGE_SIZE, type EventFilters } from "@/server/queries/admin-events";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "events", "read");

  const params = await searchParams;
  const filters: EventFilters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, offices] = await Promise.all([
    listAdminEvents(actor, filters),
    actor.role === "super_admin" ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Events"
        count={total}
        actions={
          can(actor, "events", "create") ? (
            <NewButton href="/admin/events/new">Add an event</NewButton>
          ) : null
        }
      />

      <EditorialFilters
        placeholder="Title, web address or summary"
        selects={[
          {
            name: "status",
            label: "Status",
            options: contentStatuses.map((status) => ({ value: status, label: status })),
          },
          {
            name: "type",
            label: "Kind",
            options: eventTypes.map((type) => ({ value: type, label: eventTypeLabels[type] })),
          },
          ...(offices.length > 0
            ? [
                {
                  name: "office",
                  label: "Office",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Clear the search, or add an event.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.title}</span>
                </TableCell>
                <TableCell>
                  <FlatBadge variant="outline">{eventTypeLabels[row.eventType]}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>{formatInOfficeTz(row.startsAt, row.timezone ?? "UTC")}</TableCell>
                <TableCell>
                  <Link href={`/admin/events/${row.id}/registrations`}>
                    {row.seatsTaken}
                    {row.capacity === null ? "" : ` of ${row.capacity}`}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={`/events/${row.slug}`} />
                    <EditLink href={`/admin/events/${row.id}`} />
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
