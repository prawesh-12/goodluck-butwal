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
    <>
      <h1 className="t-h4">Registrations for {event.title}</h1>
      <p className="t-small admin-help">
        <Link href={`/admin/events/${event.id}`}>Back to the event</Link> · starts{" "}
        {formatInOfficeTz(event.startsAt, zone)}
      </p>

      {warning ? <p className="t-body admin-clash">{warning}</p> : null}

      <div className="admin-actions">
        <p className="t-small admin-count">
          {total} registered, {taken} seats taken
          {capacity === null ? ", no limit set" : ` of ${capacity}`}
        </p>
        {can(actor, "registrations", "export") ? (
          <a className="btn-black-sm" href={`/api/admin/export/event-registrations?event=${event.id}`}>
            Download CSV
          </a>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nobody has registered yet. Share the event page to start taking registrations.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Coming</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.fullName}</td>
                <td>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                </td>
                <td>{row.phone ?? ""}</td>
                <td>{row.attendees}</td>
                <td>{formatInOfficeTz(row.createdAt, zone)}</td>
                <td>{row.status}</td>
                <td>{row.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          {page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...query, page: String(page - 1) })}`}>Previous</Link>
          ) : null}
          <span className="t-small">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`?${new URLSearchParams({ ...query, page: String(page + 1) })}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
