import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { users } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { officeOptions } from "@/features/offices/queries";
import { UserEditor } from "@/features/users/components/user-editor";

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
      <h1 className="t-h4">{row.name}</h1>

      <UserEditor
        values={{
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          officeId: row.officeId ?? "",
          isActive: row.isActive,
        }}
        offices={offices}
      />
    </>
  );
}
