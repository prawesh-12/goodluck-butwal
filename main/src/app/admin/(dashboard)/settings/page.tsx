import { db } from "@db/client";
import { settings } from "@db/schema";
import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { SettingsEditor } from "@/components/admin/settings-editor";
import type { SocialLink } from "@/lib/validators/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const actor = await requireActor();
  allow(actor, "settings", "read");

  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const text = (key: string) => String(byKey.get(key) ?? "");

  const values = {
    site_name: text("site_name"),
    default_seo_title: text("default_seo_title"),
    default_seo_description: text("default_seo_description"),
    default_og_image_id: text("default_og_image_id"),
    social_links: (byKey.get("social_links") as SocialLink[] | undefined) ?? [],
    notify_email_au: text("notify_email_au"),
    notify_email_np: text("notify_email_np"),
    ga4_id: text("ga4_id"),
    gtm_id: text("gtm_id"),
    announcement_bar: text("announcement_bar"),
    google_rating: text("google_rating"),
    google_review_count: Number(byKey.get("google_review_count") ?? 0),
  };

  return (
    <>
      <h1 className="t-h4">Settings</h1>
      <SettingsEditor values={values} readOnly={!can(actor, "settings", "update")} />
    </>
  );
}
