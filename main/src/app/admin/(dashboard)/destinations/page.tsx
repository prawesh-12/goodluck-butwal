import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { ContentFilters } from "@/components/shared/admin/page-filters";
import { listAdminDestinations } from "@/features/destinations/admin-queries";
import { PAGE_SIZE } from "@/lib/utils/admin-query";
import { destinationPath } from "@/features/destinations/validators";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import {
  EditLink,
  EmptyState,
  ListHeader,
  NewButton,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function DestinationsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "destinations", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminDestinations({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Destinations"
        count={total}
        actions={
          can(actor, "destinations", "create") ? (
            <NewButton href="/admin/destinations/new">New destination</NewButton>
          ) : null
        }
      />

      <ContentFilters
        placeholder="Country or address"
        selects={[{ name: "status", label: "Status", anyLabel: "Any", options: STATUSES }]}
      />

      {rows.length === 0 ? (
        <EmptyState>
          No destinations match. Clear the filters, or <Link href="/admin/destinations/new">add a destination</Link>.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Has a page</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.name}</span>
                </TableCell>
                <TableCell>{destinationPath(row.slug)}</TableCell>
                <TableCell>{row.hasPage ? "Yes" : "No"}</TableCell>
                <TableCell>{row.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/destinations/${row.id}/faqs`}>Questions</Link>
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={destinationPath(row.slug)} />
                    <EditLink href={`/admin/destinations/${row.id}`} />
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
