import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/content-filters";
import { PartnerList } from "@/components/admin/partner-list";
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
    <>
      <h1 className="t-h4">Partners</h1>

      <ContentFilters placeholder="Partner name" />

      <div className="admin-actions">
        <Link href="/admin/partners/new" className="btn-black-sm">
          Add a partner
        </Link>
        <span className="t-small admin-count">{total} matching</span>
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          No partners match those filters. Clear the search, or add a partner.
        </p>
      ) : (
        <PartnerList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          canReorder={can(actor, "partners", "update")}
        />
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
