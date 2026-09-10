import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { ContentFilters } from "@/components/shared/admin/page-filters";
import { InstitutionPartnerLink } from "@/features/institutions/components/institution-partner-link";
import { institutionPath } from "@/config/course-meta";
import { coursesPerInstitution, listAdminInstitutions } from "@/features/institutions/admin-queries";
import { destinationOptions } from "@/features/courses/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
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
  const [{ rows, total, page }, destinations, counts] = await Promise.all([
    listAdminInstitutions({ ...params, page: Number(params.page ?? 1) }),
    destinationOptions(),
    coursesPerInstitution(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Institutions"
        count={total}
        actions={
          can(actor, "institutions", "create") ? (
            <NewButton href="/admin/institutions/new">Add an institution</NewButton>
          ) : null
        }
      />

      <ContentFilters
        placeholder="Name, address or country"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          {
            name: "destination",
            label: "Destination",
            anyLabel: "Any",
            options: destinations.map((destination) => ({ value: destination.id, label: destination.name })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>No institutions match. Clear the filters, or add an institution.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.name}</span>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.destination ?? "Not set"}</FlatBadge>
                </TableCell>
                <TableCell>{row.country ?? "Not set"}</TableCell>
                <TableCell>{counts.get(row.id) ?? 0}</TableCell>
                <TableCell>{row.isPartner ? "Yes" : "No"}</TableCell>
                <TableCell>{row.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
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
      )}

      <Pager page={page} pages={pages} params={params} />

      {can(actor, "institutions", "update") && can(actor, "partners", "update") ? (
        <InstitutionPartnerLink />
      ) : null}
    </div>
  );
}
