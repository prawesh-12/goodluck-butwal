import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/content-filters";
import { TeamList } from "@/components/admin/team-list";
import {
  listAdminTeam,
  officeOptions,
  PAGE_SIZE,
  type AdminFilters,
} from "@/server/queries/admin-people";

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
    <>
      <h1 className="t-h4">Team</h1>

      <ContentFilters
        placeholder="Name or position"
        offices={actor.role === "super_admin" ? offices : undefined}
      />

      <div className="admin-actions">
        <Link href="/admin/team/new" className="admin-btn">
          Add a team member
        </Link>
        <span className="t-small admin-count">{total} matching</span>
      </div>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">
          Nobody matches those filters. Clear the search, or add a team member.
        </p>
      ) : (
        <TeamList
          key={rows.map((row) => row.id).join("-")}
          rows={rows}
          canReorder={can(actor, "team", "update")}
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
