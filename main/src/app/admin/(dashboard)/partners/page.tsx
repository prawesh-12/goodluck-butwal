import { Handshake } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageHeader, ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { NewButton, Pager, ResultCount } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { PartnerList } from "@/features/partners/components/partner-list";
import { listAdminPartners } from "@/features/partners/admin-queries";
import { PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";

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
  const narrowed = Boolean(params.q || params.status);
  const canCreate = can(actor, "partners", "create");

  return (
    <>
      <PageHeader
        title="Partners"
        description="The logos shown on the website."
        actions={
          <>
            <ViewOnSiteButton href="/" label="View the home page" />
            {canCreate ? <NewButton href="/admin/partners/new">Add partner</NewButton> : null}
          </>
        }
      />

      <FilterBar
        searchPlaceholder="Search partners"
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
        ]}
      />

      {rows.length === 0 ? (
        narrowed ? (
          <EmptyState
            icon={Handshake}
            title="No partners match those filters"
            description="Clear the search or the filters to see them all again."
          />
        ) : (
          <EmptyState
            icon={Handshake}
            title="No partners yet"
            description="Add the first partner to show its logo on the home page."
            action={canCreate ? <NewButton href="/admin/partners/new">Add partner</NewButton> : null}
          />
        )
      ) : (
        <PartnerList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          canReorder={can(actor, "partners", "update")}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="partners" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </>
  );
}
