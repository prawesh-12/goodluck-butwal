import { forbidden } from "next/navigation";
import { can, type Action, type Actor, type Entity } from "@/lib/rbac";

// Page-level checks. rbac stays pure and throwing, this is the one place that answers with 403.
export function allow(actor: Actor, entity: Entity, action: Action) {
  if (!can(actor, entity, action)) forbidden();
}

// Checked on the loaded row, never on the id that came from the URL.
export function allowOwn(actor: Actor, row: { officeId: string | null }) {
  if (actor.role === "super_admin") return;
  if (row.officeId === null) return;
  if (row.officeId !== actor.officeId) forbidden();
}
