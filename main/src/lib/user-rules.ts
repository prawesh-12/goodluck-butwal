import type { UserRole } from "./rbac";

// The exact words an admin has to type to allow a third super admin.
export const THIRD_SUPER_ADMIN_PHRASE = "add a third super admin";

type Change = {
  actorId: string;
  targetId: string;
  targetWasSuperAdmin: boolean;
  targetWasActive: boolean;
  nextRole: UserRole;
  nextActive: boolean;
  // Super admins that are active right now, the target included if it is one.
  activeSuperAdmins: number;
  confirmation?: string;
};

// Returns the reason a change is refused, or null when it is allowed. Kept apart from the
// database so every branch can be tested directly.
export function refusalReason(change: Change): string | null {
  const {
    actorId,
    targetId,
    targetWasSuperAdmin,
    targetWasActive,
    nextRole,
    nextActive,
    activeSuperAdmins,
    confirmation,
  } = change;

  if (actorId === targetId) {
    if (nextRole !== "super_admin") return "You cannot change your own role.";
    if (!nextActive) return "You cannot deactivate your own account.";
  }

  const losingASuperAdmin =
    targetWasSuperAdmin && targetWasActive && (nextRole !== "super_admin" || !nextActive);

  if (losingASuperAdmin && activeSuperAdmins <= 1) {
    return "There has to be one active super admin left.";
  }

  const gainingASuperAdmin =
    nextRole === "super_admin" && nextActive && !(targetWasSuperAdmin && targetWasActive);

  if (gainingASuperAdmin && activeSuperAdmins >= 2) {
    return confirmation?.trim().toLowerCase() === THIRD_SUPER_ADMIN_PHRASE
      ? null
      : `Two super admins is the limit. Type "${THIRD_SUPER_ADMIN_PHRASE}" to add another.`;
  }

  return null;
}
