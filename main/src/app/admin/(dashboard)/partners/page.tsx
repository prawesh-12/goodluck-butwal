import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/content-filters";
import { PartnerList } from "@/components/admin/partner-list";
import { EmptyState, ListHeader, NewButton, Pager } from "@/components/admin/list-ui";
import { listAdminPartners, PAGE_SIZE, type AdminFilters } from "@/server/queries/admin-people";

export const dynamic = "force-dynamic";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "partners", "read");

  const params = await searchParams;
  const filters: AdminFilters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listAdminPartners(filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Partners"
        count={total}
        actions={<NewButton href="/admin/partners/new">Add a partner</NewButton>}
      />

      <ContentFilters placeholder="Partner name" />

      {rows.length === 0 ? (
        <EmptyState>No partners match those filters. Clear the search, or add a partner.</EmptyState>
      ) : (
        <PartnerList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          canReorder={can(actor, "partners", "update")}
        />
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
