import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { users } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { FlatBadge, StatusBadge } from "@/components/shared/admin/list-ui";
import { officeOptions } from "@/features/offices/queries";
import { UserEditor } from "@/features/users/components/user-editor";
import { roleLabel } from "@/features/users/components/roles";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "users", "update");

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      officeId: users.officeId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, (await params).id));
  if (!row) notFound();

  const offices = await officeOptions();

  return (
    <>
      <EditorHeader
        backHref="/admin/users"
        backLabel="Users"
        title={row.name}
        meta={
          <>
            <StatusBadge status={row.isActive ? "active" : "deactivated"} />
            <FlatBadge>{roleLabel(row.role)}</FlatBadge>
          </>
        }
      />

      <UserEditor
        values={{
          id: row.id,
          name: row.name,
          email: row.email,
          password: "",
          role: row.role,
          officeId: row.officeId ?? "",
          isActive: row.isActive,
          confirmation: "",
        }}
        offices={offices}
      />
    </>
  );
}
