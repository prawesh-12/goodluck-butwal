import type { UserRole } from "@/lib/auth/rbac";

// The exact words an admin has to type to allow a third admin.
export const THIRD_ADMIN_PHRASE = "add a third admin";

type Change = {
  actorId: string;
  targetId: string;
  targetWasAdmin: boolean;
  targetWasActive: boolean;
  nextRole: UserRole;
  nextActive: boolean;
  // Admins that are active right now, the target included if it is one.
  activeAdmins: number;
  confirmation?: string;
};

// Kept apart from the database so every branch can be tested directly.
export function refusalReason(change: Change): string | null {
  const { actorId, targetId, targetWasAdmin, targetWasActive, nextRole, nextActive, activeAdmins, confirmation } = change;

  if (actorId === targetId) {
    if (nextRole !== "admin") return "You cannot change your own role.";
    if (!nextActive) return "You cannot deactivate your own account.";
  }

  const losingAnAdmin = targetWasAdmin && targetWasActive && (nextRole !== "admin" || !nextActive);

  if (losingAnAdmin && activeAdmins <= 1) {
    return "There has to be one active admin left.";
  }

  const gainingAnAdmin = nextRole === "admin" && nextActive && !(targetWasAdmin && targetWasActive);

  if (gainingAnAdmin && activeAdmins >= 2) {
    return confirmation?.trim().toLowerCase() === THIRD_ADMIN_PHRASE
      ? null
      : `Two admins is the limit. Type "${THIRD_ADMIN_PHRASE}" to add another.`;
  }

  return null;
}
