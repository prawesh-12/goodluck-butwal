import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@db/client";
import { auditLog, users } from "@db/schema";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { formatInOfficeTz } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const actor = await requireActor();
  allow(actor, "auditLog", "read");

  const { from, to } = await searchParams;
  const filters = [
    from ? gte(auditLog.createdAt, new Date(from)) : undefined,
    to ? lte(auditLog.createdAt, new Date(`${to}T23:59:59Z`)) : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      action: auditLog.action,
      entityType: auditLog.entityType,
      summary: auditLog.summary,
      who: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE_SIZE);

  return (
    <>
      <h1 className="t-h4">Audit log</h1>

      <form className="admin-filters">
        <label className="admin-field">
          <span className="t-small">From</span>
          <input type="date" name="from" defaultValue={from} />
        </label>
        <label className="admin-field">
          <span className="t-small">To</span>
          <input type="date" name="to" defaultValue={to} />
        </label>
        <button type="submit" className="btn-black-sm">
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">Nothing recorded in that range.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>What</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatInOfficeTz(row.createdAt, "Australia/Melbourne")}</td>
                <td>{row.who ?? "System"}</td>
                <td>{row.action}</td>
                <td>{row.summary ?? row.entityType ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
