import { forbidden } from "next/navigation";
import { can, type Action, type Actor, type Entity } from "@/lib/rbac";

// Page-level check. rbac stays pure and throwing, this is the one place that answers with 403.
export function allow(actor: Actor, entity: Entity, action: Action) {
  if (!can(actor, entity, action)) forbidden();
}
