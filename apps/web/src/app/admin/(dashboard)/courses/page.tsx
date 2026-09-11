import Link from "next/link";
import { GraduationCap, Upload } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { EmptyState } from "@/components/shared/admin/states";
import { QUALIFICATION_LABEL, coursePath, qualificationLevels } from "@/config/course-meta";
import { CourseCategoryManager } from "@/features/courses/components/course-category-manager";
import {
  coursesPerCategory,
  destinationOptions,
  listAdminCourses,
  listCourseCategories,
} from "@/features/courses/admin-queries";
import { institutionOptions } from "@/features/institutions/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { Button } from "@/components/ui/admin/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/admin/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  NewButton,
  Pager,
  ResultCount,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "courses", "read");

  const params = await searchParams;
  const [{ rows, total, page }, institutions, categories, destinations, categoryCounts] = await Promise.all([
    listAdminCourses({ ...params, page: Number(params.page ?? 1) }),
    institutionOptions(),
    listCourseCategories(),
    destinationOptions(),
    coursesPerCategory(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const canCreate = can(actor, "courses", "create");
  const canReadCategories = can(actor, "courseCategories", "read");
  const tab = canReadCategories && params.tab === "categories" ? "categories" : "courses";
  const searching = Boolean(
    params.q || params.status || params.institution || params.category || params.level || params.destination,
  );

  const courseList = (
    <div className="space-y-6">
      <FilterBar
        searchPlaceholder="Search courses"
        filters={[
          { name: "status", label: "Status", anyLabel: "All statuses", options: STATUSES },
          {
            name: "institution",
            label: "Institution",
            anyLabel: "All institutions",
            options: institutions.map((row) => ({ value: row.id, label: row.name })),
          },
          {
            name: "category",
            label: "Subject area",
            anyLabel: "All subject areas",
            options: categories.map((row) => ({ value: row.id, label: row.name })),
          },
          {
            name: "level",
            label: "Qualification",
            anyLabel: "All qualifications",
            options: qualificationLevels.map((level) => ({ value: level, label: QUALIFICATION_LABEL[level] })),
          },
          {
            name: "destination",
            label: "Destination",
            anyLabel: "All destinations",
            options: destinations.map((row) => ({ value: row.id, label: row.name })),
          },
        ]}
      />

      {rows.length === 0 ? (
        searching ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses match your filters"
            description="Try a different search, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description="Add a course, or import a spreadsheet to load a whole catalogue at once."
            action={canCreate ? <NewButton href="/admin/courses/new">New course</NewButton> : null}
          />
        )
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Institution</TableHead>
                <TableHead className="hidden lg:table-cell">Qualification</TableHead>
                <TableHead className="hidden lg:table-cell">Subject area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.institution ?? <Muted>Not set</Muted>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {row.qualificationLevel ? (
                      <FlatBadge variant="outline">{QUALIFICATION_LABEL[row.qualificationLevel]}</FlatBadge>
                    ) : (
                      <Muted>Not set</Muted>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {row.category ? <FlatBadge variant="outline">{row.category}</FlatBadge> : <Muted>Not set</Muted>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      <ViewSiteLink href={coursePath(row.slug)} />
                      <EditLink href={`/admin/courses/${row.id}`} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="courses" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </div>
  );

  const categoryList = (
    <CourseCategoryManager
      rows={categories.map((category) => ({
        ...category,
        courses: categoryCounts.get(category.id) ?? 0,
      }))}
      canCreate={can(actor, "courseCategories", "create")}
      canEdit={can(actor, "courseCategories", "update")}
      canDelete={can(actor, "courseCategories", "delete")}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="The course catalogue students browse and filter."
        actions={
          canCreate ? (
            <>
              <Button variant="outline" render={<Link href="/admin/courses/import" />}>
                  <Upload />
                  Import
                </Button>
              <NewButton href="/admin/courses/new">New course</NewButton>
            </>
          ) : null
        }
      />

      {canReadCategories ? (
        <Tabs value={tab} className="gap-6">
          <TabsList>
            <TabsTrigger value="courses" render={<Link href="/admin/courses" />}>Courses</TabsTrigger>
            <TabsTrigger value="categories" render={<Link href="/admin/courses?tab=categories" />}>Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="courses">{courseList}</TabsContent>
          <TabsContent value="categories">{categoryList}</TabsContent>
        </Tabs>
      ) : (
        courseList
      )}
    </div>
  );
}
