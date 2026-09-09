import { asc } from "drizzle-orm";
import { db } from "@db/client";
import { offices, users } from "@db/schema";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  RowAvatar,
  StatusBadge,
} from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  au_admin: "Australia admin",
  np_admin: "Nepal admin",
  content_editor: "Content editor",
};

export default async function UsersPage() {
  const actor = await requireActor();
  allow(actor, "users", "read");

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      office: offices.name,
    })
    .from(users)
    .leftJoin(offices, eq(users.officeId, offices.id))
    .orderBy(asc(users.name));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Users"
        count={rows.length}
        countNoun="accounts"
        actions={
          can(actor, "users", "create") ? (
            <NewButton href="/admin/users/new">Add a user</NewButton>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState>No accounts yet.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.name} />
                    <span className="font-medium">{row.name}</span>
                  </span>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <FlatBadge>{ROLE_LABEL[row.role] ?? row.role}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "All"}</FlatBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.isActive ? "Active" : "Deactivated"} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <EditLink href={`/admin/users/${row.id}`} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
