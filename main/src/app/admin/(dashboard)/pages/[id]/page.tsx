import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageEditor } from "@/features/pages/components/page-editor";
import { getAdminPage } from "@/features/pages/admin-queries";
import { pickedMedia } from "@/features/media/admin-queries";
import { pagePath } from "@/features/pages/validators";

export const dynamic = "force-dynamic";

function idsIn(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(idsIn);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      key.endsWith("_id") ? (typeof child === "string" ? [child] : []) : idsIn(child),
    );
  }
  return [];
}

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "pages", "update");

  const row = await getAdminPage((await params).id);
  if (!row) notFound();

  const blocks = (row.blocks ?? {}) as Record<string, unknown>;
  const media = await pickedMedia([row.heroImageId, row.seoOgImageId, ...idsIn(blocks)]);
  const path = pagePath(row.parent, row.slug);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.title}</h1>
        <a className="admin-btn" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <PageEditor
        canDelete={can(actor, "pages", "delete")}
        canPublish={can(actor, "pages", "publish")}
        media={media}
        value={{
          id: row.id,
          slug: row.slug,
          parent: row.parent,
          title: row.title,
          intro: row.intro ?? "",
          bodyHtml: row.bodyHtml ?? "",
          heroImageId: row.heroImageId,
          showInNav: row.showInNav,
          status: row.status,
          sortOrder: row.sortOrder,
          blocks,
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
