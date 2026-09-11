import { forbidden } from "next/navigation";
import { can, seesAllOffices, type Action, type Actor, type Entity } from "@/lib/auth/rbac";

// Page-level checks. rbac stays pure and throwing, this is the one place that answers with 403.
export function allow(actor: Actor, entity: Entity, action: Action) {
  if (!can(actor, entity, action)) forbidden();
}

// Checked on the loaded row, never on the id that came from the URL.
export function allowOwn(actor: Actor, row: { officeId: string | null }) {
  if (seesAllOffices(actor)) return;
  if (row.officeId === null) return;
  if (row.officeId !== actor.officeId) forbidden();
}
