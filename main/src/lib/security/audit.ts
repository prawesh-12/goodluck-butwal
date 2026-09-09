import { db } from "@db/client";
import { auditLog } from "@db/schema";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "login"
  | "login_failed"
  | "export";

export type AuditEntry = {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  // One plain sentence. It is read by a person, not parsed.
  summary?: string;
  ipHash?: string;
};

export async function writeAudit(entry: AuditEntry) {
  await db.insert(auditLog).values(entry);
}
