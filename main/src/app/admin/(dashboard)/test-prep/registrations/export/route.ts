import { requireActor } from "@/lib/session";
import { can } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { csvResponse, toCsv } from "@/lib/csv";
import { exportTestPrepRegistrations, type RegistrationFilters } from "@/server/queries/admin-test-prep";

export const dynamic = "force-dynamic";

const ENTITY = "test-prep-registrations";

export async function GET(request: Request) {
  const actor = await requireActor();
  if (!can(actor, "registrations", "export")) {
    await writeAudit({
      userId: actor.id,
      action: "export",
      entityType: ENTITY,
      summary: `refused, ${actor.role} may not export ${ENTITY}`,
    });
    return new Response("Not your area.", { status: 403 });
  }

  const url = new URL(request.url);
  const filters: RegistrationFilters = {
    q: url.searchParams.get("q") ?? undefined,
    batch: url.searchParams.get("batch") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  // The same filter the list uses, so an export can never reach further than the screen.
  const rows = await exportTestPrepRegistrations(actor, filters);
  await writeAudit({
    userId: actor.id,
    action: "export",
    entityType: ENTITY,
    summary: `exported ${rows.length} ${ENTITY}`,
  });

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `${ENTITY}-${date}.csv`);
}
