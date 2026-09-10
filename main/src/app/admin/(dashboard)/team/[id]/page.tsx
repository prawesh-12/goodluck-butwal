import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
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

  const [media, offices] = await Promise.all([
    pickedMedia([row.photoId]),
    officeOptions(),
  ]);

  return (
    <>
      <h1 className="t-h4">{row.fullName}</h1>
      <p className="t-small admin-help">
        <a href="/about/team" target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <TeamEditor
        values={{
          id: row.id,
          officeId: row.officeId ?? "",
          slug: row.slug,
          fullName: row.fullName,
          position: row.position ?? "",
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
