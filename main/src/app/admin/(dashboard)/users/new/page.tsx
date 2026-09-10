import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { officeOptions } from "@/features/offices/queries";
import { UserEditor } from "@/features/users/components/user-editor";

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
