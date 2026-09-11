import { GraduationCap } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { TestPrepTabs } from "@/features/test-prep/components/section-tabs";
import { CourseCard } from "@/features/test-prep/components/course-card";
import { batchesPerCourse, listAdminCourses, PAGE_SIZE } from "@/features/test-prep/admin-queries";
import { NewButton, Pager, ResultCount } from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const TESTS = [
  { value: "ielts", label: "IELTS" },
  { value: "pte", label: "PTE" },
];

export default async function TestPrepListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "testPrep", "read");

  const params = await searchParams;
  const [{ rows, total, page }, batches] = await Promise.all([
    listAdminCourses(actor, { ...params, page: Number(params.page ?? 1) }),
    batchesPerCourse(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(params.q || params.status || params.testType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test preparation"
        description="IELTS and PTE courses, their classes, and who has signed up."
        actions={can(actor, "testPrep", "create") ? <NewButton href="/admin/test-prep/new">New course</NewButton> : null}
      />

      <TestPrepTabs active="courses">
        <div className="space-y-4">
          <FilterBar
            searchPlaceholder="Search courses"
            filters={[
              { name: "status", label: "Status", anyLabel: "Any status", options: STATUSES },
              { name: "testType", label: "Test", anyLabel: "Both tests", options: TESTS },
            ]}
          />

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={GraduationCap}
                title="No courses match"
                description="Clear the search and filters to see every course."
              />
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No courses yet"
                description="Add an IELTS or PTE course, then give it the classes people can join."
                action={
                  can(actor, "testPrep", "create") ? (
                    <NewButton href="/admin/test-prep/new">New course</NewButton>
                  ) : null
                }
              />
            )
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <CourseCard key={row.id} course={row} batches={batches.get(row.id) ?? 0} actor={actor} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <ResultCount shown={rows.length} total={total} noun="courses" />
            <Pager page={page} pages={pages} params={params} />
          </div>
        </div>
      </TestPrepTabs>
    </div>
  );
}
