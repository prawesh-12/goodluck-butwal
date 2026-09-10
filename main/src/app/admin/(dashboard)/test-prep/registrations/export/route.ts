import { requireActor } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { csvResponse, toCsv } from "@/lib/utils/csv";
import { exportTestPrepRegistrations, type RegistrationFilters } from "@/features/test-prep/admin-queries";

export const dynamic = "force-dynamic";

const ENTITY = "test-prep-registrations";

export async function GET(request: Request) {
  const actor = await requireActor();
  if (!can(actor, "registrations", "export")) {
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

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `${ENTITY}-${date}.csv`);
}
