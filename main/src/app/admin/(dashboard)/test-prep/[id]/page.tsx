import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { FlatBadge, StatusBadge, ViewSiteLink } from "@/components/shared/admin/list-ui";
import { TestPrepCourseEditor } from "@/features/test-prep/components/course-editor";
import { TEST_LABEL } from "@/features/test-prep/schedule";
import { pickedMedia } from "@/features/media/admin-queries";
import { getAdminCourse } from "@/features/test-prep/admin-queries";
import { Button } from "@/components/ui/admin/button";

export const dynamic = "force-dynamic";

export default async function EditTestPrepCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "testPrep", "update");

  const row = await getAdminCourse((await params).id);
  if (!row) notFound();
  allowOwn(actor, row);

  const media = await pickedMedia([row.heroImageId]);

  return (
    <div className="space-y-6">
      <EditorHeader
        backHref="/admin/test-prep"
        backLabel="Test preparation"
        title={row.name}
        meta={
          <>
            <StatusBadge status={row.status} />
            <FlatBadge variant="outline">{TEST_LABEL[row.testType]}</FlatBadge>
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/test-prep/batches?course=${row.id}`}>
                <CalendarDays />
                Batches
              </Link>
            </Button>
            <ViewSiteLink href={`/test-preparation/${row.slug}`} />
          </>
        }
      />

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
        }}
      />
    </div>
  );
}
