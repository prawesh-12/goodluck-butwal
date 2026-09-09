import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { TagManager } from "@/features/posts/components/tag-manager";
import { listTags } from "@/features/posts/admin-queries";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const actor = await requireActor();
  allow(actor, "tags", "read");

  const rows = await listTags();

  return (
    <>
      <h1 className="t-h4">Tags</h1>
      <p className="t-small admin-count">{rows.length} tags</p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">No tags yet. Add the first one below.</p>
      ) : null}

      <TagManager
        rows={rows}
        canEdit={can(actor, "tags", "update")}
        canDelete={can(actor, "tags", "delete")}
      />
    </>
  );
}
