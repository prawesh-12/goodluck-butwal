import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { officeOptions } from "@/server/queries/admin-people";
import { UserEditor } from "@/components/admin/user-editor";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const actor = await requireActor();
  allow(actor, "users", "create");

  const offices = await officeOptions();

  return (
    <>
      <h1 className="t-h4">Add a user</h1>

      <UserEditor
        values={{ id: "", name: "", email: "", role: "content_editor", officeId: "", isActive: true }}
        offices={offices}
      />
    </>
  );
}
