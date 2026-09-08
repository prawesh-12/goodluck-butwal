import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { PostCategoryManager } from "@/components/admin/post-category-manager";
import { listPostCategories, postsPerCategory } from "@/server/queries/admin-editorial";

export const dynamic = "force-dynamic";

export default async function PostCategoriesPage() {
  const actor = await requireActor();
  allow(actor, "postCategories", "read");

  const [categories, counts] = await Promise.all([listPostCategories(), postsPerCategory()]);
  const rows = categories.map((category) => ({
    ...category,
    posts: counts.get(category.id) ?? 0,
  }));

  return (
    <>
      <h1 className="t-h4">News categories</h1>
      <p className="t-small admin-count">{rows.length} categories</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">No categories yet. Add the first one below.</p>
      ) : null}

      <PostCategoryManager
        rows={rows}
        canEdit={can(actor, "postCategories", "update")}
        canDelete={can(actor, "postCategories", "delete")}
      />
    </>
  );
}
