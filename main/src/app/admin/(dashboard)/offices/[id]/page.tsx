import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { getAdminOffice } from "@/features/offices/admin-queries";
import { pickedMediaMap } from "@/features/media/admin-queries";
import { OfficeEditor } from "@/features/offices/components/office-editor";

export const dynamic = "force-dynamic";

export default async function OfficePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "offices", "update");

  const row = await getAdminOffice((await params).id);
  if (!row) notFound();
  // An office row is its own office, so ownership is the row id.
  allowOwn(actor, { officeId: row.id });

  const media = await pickedMediaMap([row.heroImageId, row.seoOgImageId]);

  return (
    <>
      <h1 className="t-h4">{row.name}</h1>
      <p className="t-small admin-help">
        <a href="/contact" target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <OfficeEditor
        values={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          country: row.country,
          timezone: row.timezone,
          addressLine1: row.addressLine1 ?? "",
          addressLine2: row.addressLine2 ?? "",
          city: row.city ?? "",
          state: row.state ?? "",
          postcode: row.postcode ?? "",
          phone: row.phone ?? "",
          phoneDisplay: row.phoneDisplay ?? "",
          whatsapp: row.whatsapp ?? "",
          email: row.email ?? "",
          mapsUrl: row.mapsUrl ?? "",
          mapsEmbedUrl: row.mapsEmbedUrl ?? "",
          openingHours: row.openingHours ?? [],
          profileHtml: row.profileHtml ?? "",
          credentialsHtml: row.credentialsHtml ?? "",
          isActive: row.isActive,
          status: row.status,
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
          seoNoindex: row.seoNoindex,
          canonicalUrl: row.canonicalUrl ?? "",
        }}
        heroImage={media.get(row.heroImageId ?? "") ?? null}
        shareImage={media.get(row.seoOgImageId ?? "") ?? null}
        canPublish={can(actor, "offices", "publish")}
      />
    </>
  );
}
