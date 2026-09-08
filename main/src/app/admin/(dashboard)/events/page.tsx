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
    <>
      <h1 className="t-h4">Events</h1>

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

      <div className="admin-actions">
        <p className="t-small admin-count">{total} matching</p>
        {can(actor, "events", "create") ? (
          <Link className="btn-black-sm" href="/admin/events/new">
            Add an event
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nothing matches those filters. Clear the search, or add an event.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Kind</th>
              <th>Office</th>
              <th>Starts</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Live page</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/events/${row.id}`}>{row.title}</Link>
                </td>
                <td>{eventTypeLabels[row.eventType]}</td>
                <td>{row.office ?? "Not set"}</td>
                <td>{formatInOfficeTz(row.startsAt, row.timezone ?? "UTC")}</td>
                <td>
                  <Link href={`/admin/events/${row.id}/registrations`}>
                    {row.seatsTaken}
                    {row.capacity === null ? "" : ` of ${row.capacity}`}
                  </Link>
                </td>
                <td>{row.status}</td>
                <td>
                  <a href={`/events/${row.slug}`} target="_blank" rel="noreferrer">
                    View on site
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          {page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link>
          ) : null}
          <span className="t-small">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
