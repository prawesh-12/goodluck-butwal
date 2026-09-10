import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { ContentFilters } from "@/components/shared/admin/content-filters";
import { TeamList } from "@/features/team/components/team-list";
import { EmptyState, ListHeader, NewButton, Pager } from "@/components/shared/admin/list-ui";
import { listAdminTeam } from "@/features/team/admin-queries";
import { officeOptions } from "@/features/offices/queries";
import { PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "team", "read");

  const params = await searchParams;
  const filters: AdminFilters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, offices] = await Promise.all([
    listAdminTeam(actor, filters),
    officeOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Team"
        count={total}
        actions={<NewButton href="/admin/team/new">Add a team member</NewButton>}
      />

      <ContentFilters
        placeholder="Name or position"
        offices={actor.role === "super_admin" ? offices : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState>Nobody matches those filters. Clear the search, or add a team member.</EmptyState>
      ) : (
        <TeamList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          canReorder={can(actor, "team", "update")}
        />
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
