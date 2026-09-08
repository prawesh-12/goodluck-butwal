import { db } from "../client";
import { settings, uiStrings } from "../schema";
import { footerLinks, social } from "../../src/lib/site";

type StringRow = { key: string; value: string; group: string; label: string; help: string };

// Footer columns become one row per link, so an admin can retitle or repoint one without a
// developer. The key carries the column and position.
function footerRows(): StringRow[] {
  const rows: StringRow[] = [];

  for (const [column, links] of Object.entries(footerLinks)) {
    const slug = column.toLowerCase();
    rows.push({
      key: `footer.${slug}.title`,
      value: column,
      group: "footer",
      label: `${column} column heading`,
      help: "The heading above this group of footer links.",
    });

    links.forEach((link, index) => {
      rows.push({
        key: `footer.${slug}.${index}.label`,
        value: link.label,
        group: "footer",
        label: `${column} link ${index + 1} text`,
        help: `Points at ${link.href}.`,
      });
      rows.push({
        key: `footer.${slug}.${index}.href`,
        value: link.href,
        group: "footer",
        label: `${column} link ${index + 1} address`,
        help: "Where the link goes. Start with / for a page on this site.",
      });
    });
  }
  return rows;
}

export async function seedUiStrings() {
  const rows = footerRows();

  for (const row of rows) {
    await db
      .insert(uiStrings)
      .values(row)
      // Only the wording an admin has not touched is refreshed; the value is left alone.
      .onConflictDoUpdate({
        target: uiStrings.key,
        set: { label: row.label, help: row.help, group: row.group },
      });
  }
  return rows.length;
}

export async function seedSettings() {
  const rows = [
    {
      key: "social_links",
      value: social.map((s) => ({ label: s.label, href: s.href, icon: s.icon })),
    },
  ];

  for (const row of rows) {
    await db
      .insert(settings)
      .values(row)
      .onConflictDoNothing({ target: settings.key });
  }
  return rows.length;
}
