import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { officeOptions } from "@/features/offices/queries";
import { UserEditor } from "@/features/users/components/user-editor";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const actor = await requireActor();
  allow(actor, "users", "create");

  const offices = await officeOptions();

  return (
    <>
      <EditorHeader backHref="/admin/users" backLabel="Users" title="Add user" />

      <UserEditor
        values={{
          id: "",
          name: "",
          email: "",
          password: "",
          role: "content_editor",
          officeId: "",
          isActive: true,
          confirmation: "",
        }}
        offices={offices}
      />
    </>
  );
}
