import type { EditorialFilters as Filters } from "@/lib/utils/admin-query";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { contentStatuses } from "@/lib/validators/fields";
import { EditorialFilters } from "@/components/shared/admin/editor-filters";
import { officeOptions } from "@/features/offices/queries";
import { listAdminPosts, listPostCategories, listTags, postsPerCategory } from "@/features/posts/admin-queries";
import { PostCategoryManager } from "@/features/posts/components/post-category-manager";
import { TagManager } from "@/features/posts/components/tag-manager";
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
  const [{ rows, total, page }, categories, counts, tags, offices] = await Promise.all([
    listAdminPosts(actor, filters),
    listPostCategories(),
    postsPerCategory(),
    listTags(),
    actor.role === "super_admin" ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="News"
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

      {can(actor, "postCategories", "read") ? (
        <details>
          <summary className="t-h5 admin-subhead">Categories ({categories.length})</summary>
          <PostCategoryManager
            rows={categories.map((category) => ({ ...category, posts: counts.get(category.id) ?? 0 }))}
            canEdit={can(actor, "postCategories", "update")}
            canDelete={can(actor, "postCategories", "delete")}
          />
        </details>
      ) : null}

      {can(actor, "tags", "read") ? (
        <details>
          <summary className="t-h5 admin-subhead">Tags ({tags.length})</summary>
          <TagManager
            rows={tags}
            canEdit={can(actor, "tags", "update")}
            canDelete={can(actor, "tags", "delete")}
          />
        </details>
      ) : null}
    </div>
  );
}
