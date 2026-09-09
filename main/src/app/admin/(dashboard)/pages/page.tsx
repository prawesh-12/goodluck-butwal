import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ContentFilters } from "@/components/admin/page-filters";
import { listAdminPages, PAGE_SIZE } from "@/server/queries/admin-content";
import { pagePath } from "@/lib/validators/page";
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

export default async function PagesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "pages", "read");

  const params = await searchParams;
  const { rows, total, page } = await listAdminPages({ ...params, page: Number(params.page ?? 1) });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Pages"
        count={total}
        actions={
          can(actor, "pages", "create") ? <NewButton href="/admin/pages/new">New page</NewButton> : null
        }
      />

      <ContentFilters
        placeholder="Title or address"
        selects={[
          { name: "status", label: "Status", anyLabel: "Any", options: STATUSES },
          {
            name: "parent",
            label: "Section",
            anyLabel: "Any",
            options: [
              { value: "about", label: "About" },
              { value: "legal", label: "Legal" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>No pages match. Clear the filters, or add a page.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>In menu</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium">{row.title}</span>
                </TableCell>
                <TableCell>{pagePath(row.parent, row.slug)}</TableCell>
                <TableCell>
                  <FlatBadge>{row.parent}</FlatBadge>
                </TableCell>
                <TableCell>{row.showInNav ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href={pagePath(row.parent, row.slug)} />
                    <EditLink href={`/admin/pages/${row.id}`} />
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
