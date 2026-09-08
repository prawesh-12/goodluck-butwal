"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@db/client";
import { settings } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { settingsSchema } from "@/lib/validators/settings";

type Result = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateSettings(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "settings", "update");

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const now = new Date();
  const rows = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value,
    updatedBy: actor.id,
    updatedAt: now,
  }));

  await db
    .insert(settings)
    .values(rows)
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql`excluded.value`, updatedBy: actor.id, updatedAt: now },
    });

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "settings",
    summary: "site settings saved",
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
