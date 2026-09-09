import { asc } from "drizzle-orm";
import { db } from "@db/client";
import { uiStrings } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { SiteTextEditor, type SiteTextGroup } from "@/features/site-text/components/site-text-editor";

export const dynamic = "force-dynamic";

export default async function SiteTextPage() {
  const actor = await requireActor();
  allow(actor, "uiStrings", "read");

  const rows = await db
    .select({
      key: uiStrings.key,
      value: uiStrings.value,
      group: uiStrings.group,
      label: uiStrings.label,
      help: uiStrings.help,
    })
    .from(uiStrings)
    .orderBy(asc(uiStrings.group), asc(uiStrings.key));

  const groups = new Map<string, SiteTextGroup>();
  for (const row of rows) {
    const group = groups.get(row.group) ?? { name: row.group, rows: [] };
    group.rows.push({ key: row.key, value: row.value, label: row.label, help: row.help });
    groups.set(row.group, group);
  }

  return (
    <>
      <h1 className="t-h4">Site text</h1>
      <p className="t-small admin-count">
        {rows.length} pieces of text. Developers add new ones, you change the wording.
      </p>

      {rows.length === 0 ? (
        <p className="t-body admin-empty">No site text yet. Seed the database first.</p>
      ) : (
        <SiteTextEditor groups={[...groups.values()]} />
      )}
    </>
  );
}
