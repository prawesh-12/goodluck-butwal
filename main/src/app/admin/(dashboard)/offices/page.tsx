import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { ContentFilters } from "@/components/shared/admin/content-filters";
import { listAdminOffices } from "@/features/offices/admin-queries";
import { PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  EditLink,
  EmptyState,
  ListHeader,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function OfficesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "offices", "read");

  const params = await searchParams;
  const filters: AdminFilters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, page } = await listAdminOffices(actor, filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader title="Offices" count={total} />
      <p className="t-small admin-help">
        The offices are fixed. You can change their details, but not add or remove one.
      </p>

      <ContentFilters placeholder="Office, city or country" />

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Clear the search to see your office.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Office</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Phone</TableHead>
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
                <TableCell>{row.city ?? "Not set"}</TableCell>
                <TableCell>{row.phoneDisplay ?? "Not set"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.isActive ? "" : ", temporarily closed"}
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href="/contact" />
                    <EditLink href={`/admin/offices/${row.id}`} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pager page={page} pages={pages} params={params} />
    </div>
  );
}
