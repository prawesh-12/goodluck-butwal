import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { StatusBadge, ViewSiteLink } from "@/components/shared/admin/list-ui";
import { getAdminTeamMember } from "@/features/team/admin-queries";
import { officeOptions } from "@/features/offices/queries";
import { pickedMedia } from "@/features/media/admin-queries";
import { TeamEditor } from "@/features/team/components/team-editor";

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "team", "update");

  const row = await getAdminTeamMember((await params).id);
  if (!row) notFound();
  allowOwn(actor, row);

  const [media, offices] = await Promise.all([pickedMedia([row.photoId]), officeOptions()]);

  return (
    <>
      <EditorHeader
        backHref="/admin/team"
        backLabel="Team"
        title={row.fullName}
        meta={<StatusBadge status={row.status} />}
        actions={<ViewSiteLink href="/about/team" label="View the team page" />}
      />

      <TeamEditor
        values={{
          id: row.id,
          officeId: row.officeId ?? "",
          slug: row.slug,
          fullName: row.fullName,
          position: row.position ?? "",
          photoId: row.photoId ?? "",
          bioHtml: row.bioHtml ?? "",
          qualifications: row.qualifications ?? [],
          expertise: row.expertise ?? [],
          email: row.email ?? "",
          phone: row.phone ?? "",
          linkedinUrl: row.linkedinUrl ?? "",
          isCoFounder: row.isCoFounder,
          isFeatured: row.isFeatured,
          status: row.status,
        }}
        photo={media[row.photoId ?? ""] ?? null}
        offices={offices}
        canPublish={can(actor, "team", "publish")}
        canDelete={can(actor, "team", "delete")}
      />
    </>
  );
}
