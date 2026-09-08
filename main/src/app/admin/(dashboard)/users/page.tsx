import { asc } from "drizzle-orm";
import { db } from "@db/client";
import { offices, users } from "@db/schema";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { eq } from "drizzle-orm";

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
    <>
      <h1 className="t-h4">Users</h1>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">No accounts yet. Add the first one.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Office</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{ROLE_LABEL[row.role] ?? row.role}</td>
                <td>{row.office ?? "All"}</td>
                <td>{row.isActive ? "Active" : "Deactivated"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
