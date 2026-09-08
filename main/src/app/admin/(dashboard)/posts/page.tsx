import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";
import { EditorialFilters } from "@/components/admin/editor-filters";
import { officeOptions } from "@/server/queries/admin-people";
import {
  listAdminPosts,
  listPostCategories,
  PAGE_SIZE,
  type EditorialFilters as Filters,
} from "@/server/queries/admin-editorial";

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
    <>
      <h1 className="t-h4">Posts</h1>

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

      <div className="admin-actions">
        <p className="t-small admin-count">{total} matching</p>
        {can(actor, "posts", "create") ? (
          <Link className="admin-btn" href="/admin/posts/new">
            Write a post
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nothing matches those filters. Clear the search, or write a post.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Office</th>
              <th>Status</th>
              <th>Published</th>
              <th>Minutes</th>
              <th>Live page</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/posts/${row.id}`}>{row.title}</Link>
                </td>
                <td>{row.category ?? "Not set"}</td>
                <td>{row.office ?? "Both"}</td>
                <td>{row.status}</td>
                <td>{row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : "Not set"}</td>
                <td>{row.readingMinutes ?? ""}</td>
                <td>
                  <a href={`/news/${row.slug}`} target="_blank" rel="noreferrer">
                    View on site
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          {page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link>
          ) : null}
          <span className="t-small">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
