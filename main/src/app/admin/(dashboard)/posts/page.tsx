import type { EditorialFilters as Filters } from "@/lib/utils/admin-query";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { contentStatuses } from "@/lib/validators/fields";
import { EditorialFilters } from "@/components/shared/admin/editor-filters";
import { officeOptions } from "@/features/offices/admin-queries";
import { listAdminPosts, listPostCategories } from "@/features/posts/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "posts", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, categories, offices] = await Promise.all([
    listAdminPosts(actor, filters),
    listPostCategories(),
    actor.role === "super_admin" ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Posts"
        count={total}
        actions={
          can(actor, "posts", "create") ? (
            <NewButton href="/admin/posts/new">Write a post</NewButton>
          ) : null
        }
      />

      <EditorialFilters
        placeholder="Title, web address or excerpt"
        selects={[
          {
            name: "status",
            label: "Status",
            options: contentStatuses.map((status) => ({ value: status, label: status })),
          },
          {
            name: "category",
            label: "Category",
            options: categories.map((category) => ({ value: category.id, label: category.name })),
          },
          ...(offices.length > 0
            ? [
                {
                  name: "office",
                  label: "Office",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Clear the search, or write a post.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Minutes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.title}</span>
                </TableCell>
                <TableCell>
                  <FlatBadge variant="outline">{row.category ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "Both"}</FlatBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : "Not set"}</TableCell>
                <TableCell>{row.readingMinutes ?? ""}</TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={`/news/${row.slug}`} />
                    <EditLink href={`/admin/posts/${row.id}`} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
