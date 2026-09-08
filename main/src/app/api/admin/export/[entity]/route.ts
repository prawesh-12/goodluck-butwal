import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { can, type Actor, type Entity } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { csvResponse, toCsv } from "@/lib/csv";
import { exportConsultations, exportEnquiries, type LeadFilters } from "@/server/queries/leads";
import { exportEventRegistrations } from "@/server/queries/admin-events";

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
    await writeAudit({
      userId: actor.id,
      action: "export",
      entityType: entity,
      summary: `refused, ${actor.role} may not export ${entity}`,
    });
    return new Response("Not your area.", { status: 403 });
  }

  const url = new URL(request.url);
  const filters: Filters = {
    event: url.searchParams.get("event") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  // The same filter the list uses, so an export can never reach further than the screen.
  const rows = await target.run(actor, filters);
  await writeAudit({
    userId: actor.id,
    action: "export",
    entityType: entity,
    summary: `exported ${rows.length} ${entity}`,
  });

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `${entity}-${date}.csv`);
}
