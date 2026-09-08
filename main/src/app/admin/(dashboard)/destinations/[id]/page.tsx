import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { DestinationEditor } from "@/components/admin/destination-editor";
import { getAdminDestination, pickedMedia, uiStringsFor } from "@/server/queries/admin-content";
import { destinationPath } from "@/lib/validators/destination";

export const dynamic = "force-dynamic";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "destinations", "update");

  const row = await getAdminDestination((await params).id);
  if (!row) notFound();

  const [media, strings] = await Promise.all([
    pickedMedia([row.heroImageId, row.flagImageId, row.cardImageId, row.seoOgImageId]),
    uiStringsFor(`destination.${row.slug}.`),
  ]);
  const path = destinationPath(row.slug);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name}</h1>
        <Link className="btn-black-sm" href={`/admin/destinations/${row.id}/faqs`}>
          Questions
        </Link>
        <a className="btn-black-sm" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <DestinationEditor
        canDelete={can(actor, "destinations", "delete")}
        canPublish={can(actor, "destinations", "publish")}
        media={media}
        value={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          countryCode: row.countryCode ?? "",
          tagline: row.tagline ?? "",
          heroImageId: row.heroImageId,
          flagImageId: row.flagImageId,
          cardImageId: row.cardImageId,
          factPill: row.factPill ?? "",
          overviewHtml: row.overviewHtml ?? "",
          academicHtml: row.academicHtml ?? "",
          workHtml: row.workHtml ?? "",
          isFeatured: row.isFeatured,
          hasPage: row.hasPage,
          status: row.status,
          sortOrder: row.sortOrder,
          migrationTitle: strings.get(`destination.${row.slug}.migrationTitle`) ?? "",
          whyTitle: strings.get(`destination.${row.slug}.whyTitle`) ?? "",
          checklistTitle: strings.get(`destination.${row.slug}.checklistTitle`) ?? "",
          highlights: (row.highlights ?? []).map((h) => ({ label: h.label, value: h.value, note: h.note ?? "" })),
          why: row.why ?? [],
          checklist: row.checklist ?? [],
          intakes: (row.intakes ?? []).map((i) => ({ month: i.month, note: i.note ?? "" })),
          migration: (row.migration ?? []).map((m) => ({ title: m.title, body: m.body, icon: m.icon ?? "" })),
          costs: (row.costs ?? []).map((c) => ({
            label: c.label,
            amount: c.amount,
            currency: c.currency,
            note: c.note ?? "",
          })),
          help: row.help ?? [],
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
          seoOgImageId: row.seoOgImageId,
          seoNoindex: row.seoNoindex,
          canonicalUrl: row.canonicalUrl ?? "",
        }}
      />
    </>
  );
}
