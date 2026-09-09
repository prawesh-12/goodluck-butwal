"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { uiStrings } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/security/audit";
import { uiStringSchema } from "@/features/settings/validators";

type Result =
  | { ok: true; note?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateUiString(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "uiStrings", "update");

  const parsed = uiStringSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the field below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { key, value } = parsed.data;

  const [existing] = await db
    .select({ label: uiStrings.label })
    .from(uiStrings)
    .where(eq(uiStrings.key, key));
  if (!existing) return { ok: false, error: "That text no longer exists." };

  // Nothing keeps a second copy of the seeded wording, so a cleared box leaves the current text
  // in place instead of putting a blank space on the site.
  if (value.trim() === "") {
    return { ok: true, note: "Left as it was. An empty box would show a blank space on the site." };
  }

  await db
    .update(uiStrings)
    .set({ value, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(uiStrings.key, key));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "ui_strings",
    entityId: key,
    summary: `${existing.label ?? key} reworded`,
  });

  revalidatePath("/admin/site-text");
  revalidatePath("/", "layout");
  return { ok: true };
}
