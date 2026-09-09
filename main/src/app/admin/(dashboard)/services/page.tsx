import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminServices, PAGE_SIZE } from "@/server/queries/admin-content";
import { servicePath } from "@/lib/validators/service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  StatusBadge,
  ViewSiteLink,
} from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SCOPES = [
  { value: "both", label: "Both offices" },
  { value: "au", label: "Australia only" },
  { value: "np", label: "Nepal only" },
];

export default async function ServicesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "services", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminServices({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Services"
        count={total}
        actions={
          can(actor, "services", "create") ? (
            <NewButton href="/admin/services/new">New service</NewButton>
          ) : null
        }
      />

      <ContentFilters
        placeholder="Service or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          { name: "scope", label: "Office", anyLabel: "Any", options: SCOPES },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>No services match. Clear the filters, or add a service.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Card colour</TableHead>
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
                <TableCell>{servicePath(row.slug)}</TableCell>
                <TableCell>
                  <FlatBadge variant="outline">{row.category.replace(/_/g, " ")}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.officeScope}</FlatBadge>
                </TableCell>
                <TableCell>{row.tone ?? "Not set"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/services/${row.id}/faqs`}>Questions</Link>
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={servicePath(row.slug)} />
                    <EditLink href={`/admin/services/${row.id}`} />
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
