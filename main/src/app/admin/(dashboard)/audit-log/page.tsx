import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@db/client";
import { auditLog, users } from "@db/schema";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { formatInOfficeTz } from "@/lib/datetime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { EmptyState, ListHeader, RowAvatar } from "@/components/admin/list-ui";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";

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
    <div className="space-y-4">
      <ListHeader title="Audit log" />

      <Card>
        <CardContent className="pt-6">
          <form className="grid items-end gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="audit-from">From</Label>
              <Input id="audit-from" type="date" name="from" defaultValue={from} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-to">To</Label>
              <Input id="audit-to" type="date" name="to" defaultValue={to} />
            </div>
            <div>
              <Button type="submit">Filter</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState>Nothing recorded in that range.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>What</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatInOfficeTz(row.createdAt, "Australia/Melbourne")}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.who ?? "System"} />
                    {row.who ?? "System"}
                  </span>
                </TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>{row.summary ?? row.entityType ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
