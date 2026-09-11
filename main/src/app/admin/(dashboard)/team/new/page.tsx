import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { officeOptions } from "@/features/offices/queries";
import { TeamEditor } from "@/features/team/components/team-editor";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  const actor = await requireActor();
  allow(actor, "team", "create");

  const offices = await officeOptions();

  return (
    <>
      <EditorHeader backHref="/admin/team" backLabel="Team" title="Add team member" />

      <TeamEditor
        values={{
          id: "",
          officeId: actor.officeId ?? "",
          slug: "",
          fullName: "",
          position: "",
          photoId: "",
          bioHtml: "",
          qualifications: [],
          expertise: [],
          email: "",
          phone: "",
          linkedinUrl: "",
          isCoFounder: false,
          isFeatured: false,
          status: "draft",
        }}
        photo={null}
        offices={offices}
        canPublish={can(actor, "team", "publish")}
        canDelete={false}
      />
    </>
  );
}
