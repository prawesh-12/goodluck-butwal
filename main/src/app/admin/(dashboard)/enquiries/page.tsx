import Link from "next/link";
import { Download, Inbox } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { PageHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import {
  DataCard,
  Muted,
  Pager,
  ResultCount,
  StatusBadge,
  statusLabel,
} from "@/components/shared/admin/list-ui";
import { Button } from "@/components/ui/admin/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { LeadFilters } from "@/features/leads/components/lead-filters";
import { submittedLabel } from "@/features/leads/components/lead-format";
import { listEnquiries, listServiceOptions, PAGE_SIZE, type LeadFilters as Filters } from "@/features/leads/queries";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "enquiries", "read");

  const params = await searchParams;
  const filters: Filters = { ...params, page: Number(params.page ?? 1) };
  const [{ rows, total, page }, services] = await Promise.all([
    listEnquiries(actor, filters),
    listServiceOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(params.q || params.status || params.service || params.from || params.to);

  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => value && key !== "page") as [string, string][],
  ).toString();

  const exportCsv = (
    <Button variant="outline" asChild>
      <a href={`/api/admin/export/enquiries${query ? `?${query}` : ""}`}>
        <Download />
        Export CSV
      </a>
    </Button>
  );

  return (
    <>
      <PageHeader title="Enquiries" description="Enquiries from the website." actions={exportCsv} />

      <LeadFilters
        searchPlaceholder="Search by name, email, phone or reference"
        fromLabel="Received from"
        toLabel="Received to"
        filters={[
          {
            name: "status",
            label: "Status",
            options: STATUSES.map((status) => ({ value: status, label: statusLabel(status) })),
          },
          {
            name: "service",
            label: "Service",
            options: services.map((service) => ({ value: service.slug, label: service.name })),
          },
        ]}
      />

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Inbox}
            title="No enquiries match your search"
            description="Try a different word, a wider date range, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="No enquiries yet"
            description="Enquiries people send from the website will arrive here."
          />
        )
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/enquiries/${row.id}`}
                  className="block rounded-lg border bg-card p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{row.fullName}</span>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{row.email}</p>
                  {row.phone ? <p className="text-sm text-muted-foreground">{row.phone}</p> : null}
                  <p className="mt-2 text-sm">
                    {[row.destination, row.service].filter(Boolean).join(" · ") || "No interest given"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{submittedLabel(row.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>

          <DataCard className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Destination</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.fullName}</TableCell>
                    <TableCell>
                      <a className="block text-xs underline underline-offset-4" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                      {row.phone ? (
                        <a
                          className="block text-xs underline underline-offset-4"
                          href={`tel:${row.phone.replace(/\s+/g, "")}`}
                        >
                          {row.phone}
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.destination ?? <Muted>Not given</Muted>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{row.service ?? <Muted>Not given</Muted>}</TableCell>
                    <TableCell className="whitespace-nowrap">{submittedLabel(row.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/enquiries/${row.id}`}>Open</Link>
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataCard>
        </>
      )}

      <div className="flex items-center justify-between gap-4">
        <ResultCount shown={rows.length} total={total} noun="enquiries" />
        <Pager page={page} pages={pages} params={params} />
      </div>
    </>
  );
}
