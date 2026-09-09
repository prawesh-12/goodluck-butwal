import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";
import { testimonialTypes } from "@/lib/validators/testimonial";
import { EditorialFilters } from "@/components/admin/editor-filters";
import { officeOptions } from "@/server/queries/admin-people";
import {
  listAdminTestimonials,
  PAGE_SIZE,
  type EditorialFilters as Filters,
} from "@/server/queries/admin-editorial";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import {
  ConsentBadge,
  EditLink,
  EmptyState,
  FlatBadge,
  ListHeader,
  NewButton,
  Pager,
  RowAvatar,
  StatusBadge,
  ViewSiteLink,
} from "@/components/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "testimonials", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, offices] = await Promise.all([
    listAdminTestimonials(actor, filters),
    actor.role === "super_admin" ? officeOptions() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader
        title="Testimonials"
        count={total}
        actions={
          can(actor, "testimonials", "create") ? (
            <NewButton href="/admin/testimonials/new">Add a story</NewButton>
          ) : null
        }
      />

      <EditorialFilters
        placeholder="Name or words in the quote"
        selects={[
          {
            name: "status",
            label: "Status",
            options: contentStatuses.map((status) => ({ value: status, label: status })),
          },
          {
            name: "type",
            label: "Kind",
            options: testimonialTypes.map((type) => ({ value: type, label: type })),
          },
          ...(offices.length > 0
            ? [
                {
                  name: "office",
                  label: "Office",
                  options: offices.map((office) => ({ value: office.id, label: office.name })),
                },
              ]
            : []),
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Clear the search, or add a story.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shown as</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Consent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <RowAvatar name={row.displayName || "?"} />
                    <span className="font-medium">{row.displayName || "No name yet"}</span>
                    {row.isAnonymised ? <FlatBadge>anonymised</FlatBadge> : null}
                  </span>
                </TableCell>
                <TableCell>
                  <FlatBadge variant="outline">{row.type}</FlatBadge>
                </TableCell>
                <TableCell>
                  <FlatBadge>{row.office ?? "Both"}</FlatBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <ConsentBadge given={row.consentGiven} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href="/success-stories" />
                    <EditLink href={`/admin/testimonials/${row.id}`} />
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
