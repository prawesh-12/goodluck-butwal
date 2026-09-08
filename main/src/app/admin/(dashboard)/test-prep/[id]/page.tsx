import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { TestPrepCourseEditor } from "@/components/admin/testprep-course-editor";
import { pickedMedia } from "@/server/queries/admin-content";
import { getAdminCourse } from "@/server/queries/admin-test-prep";

export const dynamic = "force-dynamic";

export default async function EditTestPrepCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "testPrep", "update");

  const row = await getAdminCourse((await params).id);
  if (!row) notFound();
  allowOwn(actor, row);

  const media = await pickedMedia([row.heroImageId, row.seoOgImageId]);
  const path = `/test-preparation/${row.slug}`;

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name}</h1>
        <Link className="btn-black-sm" href={`/admin/test-prep/batches?course=${row.id}`}>
          Batches
        </Link>
        <a className="btn-black-sm" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <TestPrepCourseEditor
        canDelete={can(actor, "testPrep", "delete")}
        canPublish={can(actor, "testPrep", "publish")}
        media={media}
        value={{
          id: row.id,
          slug: row.slug,
          testType: row.testType,
          name: row.name,
          summary: row.summary ?? "",
          descriptionHtml: row.descriptionHtml ?? "",
          syllabus: row.syllabus ?? [],
          heroImageId: row.heroImageId,
          defaultFee: row.defaultFee ?? "",
          feeCurrency: row.feeCurrency,
          status: row.status,
          sortOrder: row.sortOrder,
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
