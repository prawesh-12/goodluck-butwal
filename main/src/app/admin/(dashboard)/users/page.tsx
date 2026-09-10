import { asc, eq } from "drizzle-orm";
import { UserCog } from "lucide-react";
import { db } from "@db/client";
import { offices, users } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  DataCard,
  EditLink,
  FlatBadge,
  NewButton,
  ResultCount,
  RowAvatar,
  StatusBadge,
} from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { roleLabel } from "@/features/users/components/roles";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "users", "read");

  const params = await searchParams;
  const all = await db
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

  const q = (params.q ?? "").trim().toLowerCase();
  const rows = q
    ? all.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(q))
    : all;
  const canCreate = can(actor, "users", "create");

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in to the admin."
        actions={canCreate ? <NewButton href="/admin/users/new">Add user</NewButton> : null}
      />

      <FilterBar searchPlaceholder="Search by name or email" />

      {rows.length === 0 ? (
        q ? (
          <EmptyState
            icon={UserCog}
            title="Nobody matches that search"
            description="Clear the search to see every account again."
          />
        ) : (
          <EmptyState
            icon={UserCog}
            title="No accounts yet"
            description="Add the first person who should be able to sign in."
            action={canCreate ? <NewButton href="/admin/users/new">Add user</NewButton> : null}
          />
        )
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">Photo</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Office</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <RowAvatar name={row.name} />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{row.email}</TableCell>
                  <TableCell>
                    <FlatBadge>{roleLabel(row.role)}</FlatBadge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <FlatBadge>{row.office ?? "All offices"}</FlatBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.isActive ? "active" : "deactivated"} />
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
        </DataCard>
      )}

      <ResultCount shown={rows.length} total={all.length} noun="accounts" />
    </>
  );
}
