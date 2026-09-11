import { Users } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can, seesAllOffices } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { NewButton, Pager, ResultCount } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { TeamList } from "@/features/team/components/team-list";
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
  const narrowed = Boolean(params.q || params.status || params.office);
  const canCreate = can(actor, "team", "create");

  return (
    <>
      <PageHeader
        title="Team"
        description="The people shown on the website."
        actions={canCreate ? <NewButton href="/admin/team/new">Add team member</NewButton> : null}
      />

      <FilterBar
        searchPlaceholder="Search by name or position"
        filters={[
          {
            name: "status",
            label: "Status",
            anyLabel: "All statuses",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ],
          },
          ...(seesAllOffices(actor)
            ? [
                {
                  name: "office",
                  label: "Office",
                  anyLabel: "All offices",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      {rows.length === 0 ? (
        narrowed ? (
          <EmptyState
            icon={Users}
            title="No team members match those filters"
            description="Clear the search or the filters to see everyone again."
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Add the first person to show them on the team page."
            action={canCreate ? <NewButton href="/admin/team/new">Add team member</NewButton> : null}
          />
        )
      ) : (
        <TeamList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          offset={(page - 1) * PAGE_SIZE}
          canReorder={can(actor, "team", "update")}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="team members" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </>
  );
}
