import { Newspaper } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can, seesAllOffices } from "@/lib/auth/rbac";
import { contentStatuses } from "@/lib/validators/fields";
import { PAGE_SIZE, type EditorialFilters as Filters } from "@/lib/utils/admin-query";
import { formatDate } from "@/lib/utils/datetime";
import { PageHeader } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { EmptyState } from "@/components/shared/admin/states";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  NewButton,
  Pager,
  ResultCount,
  StatusBadge,
  statusLabel,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { officeOptions } from "@/features/offices/queries";
import { listAdminPosts, listPostCategories, listTags, postsPerCategory } from "@/features/posts/admin-queries";
import { PostCategoryManager } from "@/features/posts/components/post-category-manager";
import { PostsTabs } from "@/features/posts/components/posts-tabs";
import { TagManager } from "@/features/posts/components/tag-manager";

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
    seesAllOffices(actor) ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const canCreate = can(actor, "posts", "create");
  const newArticle = canCreate ? <NewButton href="/admin/posts/new">New article</NewButton> : null;

  const tabs = [
    { value: "articles", label: "Articles" },
    ...(can(actor, "postCategories", "read") ? [{ value: "categories", label: "Categories" }] : []),
    ...(can(actor, "tags", "read") ? [{ value: "tags", label: "Tags" }] : []),
  ];
  const requested = params.tab ?? "articles";
  const tab = tabs.some((option) => option.value === requested) ? requested : "articles";

  const filtered = Boolean(params.q || params.status || params.category || params.office);

  return (
    <>
      <PageHeader title="News" description="Articles and updates on the website." actions={newArticle} />

      {tabs.length > 1 ? <PostsTabs value={tab} options={tabs} /> : null}

      {tab === "categories" ? (
        <PostCategoryManager
          rows={categories.map((category) => ({ ...category, posts: counts.get(category.id) ?? 0 }))}
          canCreate={can(actor, "postCategories", "create")}
          canEdit={can(actor, "postCategories", "update")}
          canDelete={can(actor, "postCategories", "delete")}
        />
      ) : tab === "tags" ? (
        <TagManager
          rows={tags}
          canCreate={can(actor, "tags", "create")}
          canEdit={can(actor, "tags", "update")}
          canDelete={can(actor, "tags", "delete")}
        />
      ) : (
        <>
          <FilterBar
            searchPlaceholder="Search articles"
            filters={[
              {
                name: "status",
                label: "Status",
                options: contentStatuses.map((status) => ({ value: status, label: statusLabel(status) })),
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
            filtered ? (
              <EmptyState
                icon={Newspaper}
                title="No articles match your search"
                description="Try a different word, or clear the filters to see everything."
              />
            ) : (
              <EmptyState
                icon={Newspaper}
                title="No articles yet"
                description="Write your first article to share an update on the website."
                action={newArticle}
              />
            )
          ) : (
            <DataCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Office</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.title}
                        {row.category ? (
                          <span className="block text-xs font-medium text-muted-foreground sm:hidden">
                            {row.category}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {row.category ? <FlatBadge variant="outline">{row.category}</FlatBadge> : <Muted>Not set</Muted>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <FlatBadge>{row.office ?? "Both offices"}</FlatBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap md:table-cell">
                        {row.publishedAt ? formatDate(row.publishedAt.toISOString()) : <Muted>Not published</Muted>}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center justify-end gap-1">
                          {row.status === "published" ? <ViewSiteLink href={`/news/${row.slug}`} /> : null}
                          <EditLink href={`/admin/posts/${row.id}`} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataCard>
          )}

          <div className="flex items-center justify-between gap-4">
            <ResultCount shown={rows.length} total={total} noun="articles" />
            <Pager page={page} pages={pages} params={params} />
          </div>
        </>
      )}
    </>
  );
}
