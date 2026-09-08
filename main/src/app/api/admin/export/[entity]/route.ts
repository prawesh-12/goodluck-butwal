import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { can, type Actor, type Entity } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { csvResponse, toCsv } from "@/lib/csv";
import { exportConsultations, exportEnquiries, type LeadFilters } from "@/server/queries/leads";

export const dynamic = "force-dynamic";

type Export = { entity: Entity; run: (actor: Actor, f: LeadFilters) => Promise<Record<string, unknown>[]> };

const EXPORTS: Record<string, Export> = {
  enquiries: { entity: "enquiries", run: exportEnquiries },
  consultations: { entity: "consultations", run: exportConsultations },
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
  const filters: LeadFilters = {
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
