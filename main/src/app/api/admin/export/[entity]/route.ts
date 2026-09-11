import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { can, type Actor, type Entity } from "@/lib/auth/rbac";
import { csvResponse, toCsv } from "@/lib/utils/csv";
import { exportConsultations, exportEnquiries, type LeadFilters } from "@/features/leads/queries";
import { exportEventRegistrations } from "@/features/events/admin-queries";

export const dynamic = "force-dynamic";

type Filters = LeadFilters & { event?: string };
type Export = { entity: Entity; run: (actor: Actor, f: Filters) => Promise<Record<string, unknown>[]> };

const EXPORTS: Record<string, Export> = {
  enquiries: { entity: "enquiries", run: exportEnquiries },
  consultations: { entity: "consultations", run: exportConsultations },
  "event-registrations": { entity: "registrations", run: exportEventRegistrations },
};

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const target = EXPORTS[entity];
  if (!target) notFound();

  const actor = await requireActor();
  if (!can(actor, target.entity, "export")) {
    return new Response("Not your area.", { status: 403 });
  }

  const url = new URL(request.url);
  const filters: Filters = {
    event: url.searchParams.get("event") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  // The same filter the list uses, so an export can never reach further than the screen.
  const rows = await target.run(actor, filters);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `${entity}-${date}.csv`);
}
