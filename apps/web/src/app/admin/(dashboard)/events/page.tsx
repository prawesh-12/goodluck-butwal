import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { contentStatuses } from "@/lib/validators/fields";
import { eventTypeLabels, eventTypes } from "@/config/content-meta";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { officeOptions } from "@/features/offices/queries";
import { listAdminEvents, PAGE_SIZE, type EventFilters } from "@/features/events/admin-queries";
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
  statusLabel,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

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
  const filtered = Boolean(params.q || params.status || params.type || params.office);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Seminars, fairs and webinars, and who has registered for them."
        actions={can(actor, "events", "create") ? <NewButton href="/admin/events/new">New event</NewButton> : null}
      />

      <FilterBar
        searchPlaceholder="Search events"
        filters={[
          {
            name: "status",
            label: "Status",
            anyLabel: "Any status",
            options: contentStatuses.map((status) => ({ value: status, label: statusLabel(status) })),
          },
          {
            name: "type",
            label: "Kind",
            anyLabel: "Any kind",
            options: eventTypes.map((type) => ({ value: type, label: eventTypeLabels[type] })),
          },
          ...(offices.length > 0
            ? [
                {
                  name: "office",
                  label: "Office",
                  anyLabel: "Every office",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={CalendarDays}
            title="No events match"
            description="Clear the search and filters to see every event."
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Add a seminar, fair or webinar and people can register for it from the website."
            action={can(actor, "events", "create") ? <NewButton href="/admin/events/new">New event</NewButton> : null}
          />
        )
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{row.title}</span>
                      <FlatBadge variant="outline">{eventTypeLabels[row.eventType]}</FlatBadge>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatInOfficeTz(row.startsAt, row.timezone ?? "UTC")}
                  </TableCell>
                  <TableCell>{row.office ?? <Muted>Not set</Muted>}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.registrationEnabled ? (
                      <Button variant="link" size="sm" asChild className="h-auto px-0">
                        <Link href={`/admin/events/${row.id}/registrations`}>
                          {row.seatsTaken}
                          {row.capacity === null ? " registered" : ` of ${row.capacity} seats`}
                        </Link>
                      </Button>
                    ) : (
                      <Muted>Not open</Muted>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      {row.status === "published" ? <ViewSiteLink href={`/events/${row.slug}`} /> : null}
                      <EditLink href={`/admin/events/${row.id}`} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="events" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </div>
  );
}
