import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { officeOptions } from "@/features/offices/admin-queries";
import { TeamEditor } from "@/features/team/components/team-editor";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  const actor = await requireActor();
  allow(actor, "team", "create");

  const offices = await officeOptions();

  return (
    <>
      <h1 className="t-h4">Add a team member</h1>

      <TeamEditor
        values={{
          id: "",
          officeId: actor.officeId ?? "",
          slug: "",
          fullName: "",
          position: "",
          bioHtml: "",
          qualifications: [],
          expertise: [],
          email: "",
          phone: "",
          linkedinUrl: "",
          isCoFounder: false,
          isFeatured: false,
          status: "draft",
          seoTitle: "",
          seoDescription: "",
          seoNoindex: false,
          canonicalUrl: "",
        }}
        photo={null}
        shareImage={null}
        offices={offices}
        canPublish={can(actor, "team", "publish")}
        canDelete={false}
      />
    </>
  );
}
