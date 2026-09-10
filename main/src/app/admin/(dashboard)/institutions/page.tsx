import { Building2 } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/shared/admin/page-header";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { EmptyState } from "@/components/shared/admin/states";
import { InstitutionPartnerLink } from "@/features/institutions/components/institution-partner-link";
import { institutionPath } from "@/config/course-meta";
import { listAdminInstitutions } from "@/features/institutions/admin-queries";
import { destinationOptions } from "@/features/courses/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  NewButton,
  Pager,
  ResultCount,
  RowAvatar,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function InstitutionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "institutions", "read");

  const params = await searchParams;
  const [{ rows, total, page }, destinations] = await Promise.all([
    listAdminInstitutions({ ...params, page: Number(params.page ?? 1) }),
    destinationOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canCreate = can(actor, "institutions", "create");
  const searching = Boolean(params.q || params.status || params.destination);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Partner universities and colleges."
        actions={canCreate ? <NewButton href="/admin/institutions/new">New institution</NewButton> : null}
      />

      <FilterBar
        searchPlaceholder="Search institutions"
        filters={[
          { name: "status", label: "Status", anyLabel: "All statuses", options: STATUSES },
          {
            name: "destination",
            label: "Destination",
            anyLabel: "All destinations",
            options: destinations.map((destination) => ({ value: destination.id, label: destination.name })),
          },
        ]}
      />

      {rows.length === 0 ? (
        searching ? (
          <EmptyState
            icon={Building2}
            title="No institutions match your filters"
            description="Try a different search, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            icon={Building2}
            title="No institutions yet"
            description="Add the first university or college so courses have somewhere to live."
            action={canCreate ? <NewButton href="/admin/institutions/new">New institution</NewButton> : null}
          />
        )
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Destination</TableHead>
                <TableHead className="hidden lg:table-cell">Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Labels</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <RowAvatar name={row.name} />
                      <span className="font-medium">{row.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.destination ? <FlatBadge>{row.destination}</FlatBadge> : <Muted>Not set</Muted>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {row.country || <Muted>Not set</Muted>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {row.isPartner ? <FlatBadge variant="outline">Partner</FlatBadge> : null}
                      {row.isFeatured ? <FlatBadge variant="outline">Featured</FlatBadge> : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      <ViewSiteLink href={institutionPath(row.slug)} />
                      <EditLink href={`/admin/institutions/${row.id}`} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="institutions" />
        <Pager page={page} pages={pages} params={params} />
      </div>

      {can(actor, "institutions", "update") && can(actor, "partners", "update") ? (
        <InstitutionPartnerLink />
      ) : null}
    </div>
  );
}
