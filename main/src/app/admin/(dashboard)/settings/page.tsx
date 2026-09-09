import { db } from "@db/client";
import { settings } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { SettingsEditor } from "@/features/settings/components/settings-editor";
import { pickedMedia } from "@/features/media/admin-queries";
import type { SocialLink } from "@/features/settings/validators";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const actor = await requireActor();
  allow(actor, "settings", "read");

  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const text = (key: string) => String(byKey.get(key) ?? "");

  const values = {
    site_name: text("site_name"),
    hero_image_id: text("hero_image_id"),
    hero_video_id: text("hero_video_id"),
    default_seo_title: text("default_seo_title"),
    default_seo_description: text("default_seo_description"),
    default_og_image_id: text("default_og_image_id"),
    social_links: (byKey.get("social_links") as SocialLink[] | undefined) ?? [],
    notify_email_au: text("notify_email_au"),
    notify_email_np: text("notify_email_np"),
    ga4_id: text("ga4_id"),
    gtm_id: text("gtm_id"),
    google_site_verification: text("google_site_verification"),
    announcement_bar: text("announcement_bar"),
    google_rating: text("google_rating"),
    google_review_count: Number(byKey.get("google_review_count") ?? 0),
  };

  const media = await pickedMedia([values.hero_image_id, values.hero_video_id]);

  return (
    <>
      <h1 className="t-h4">Settings</h1>
      <SettingsEditor
        values={values}
        heroImage={media[values.hero_image_id] ?? null}
        heroVideo={media[values.hero_video_id] ?? null}
        readOnly={!can(actor, "settings", "update")}
      />
    </>
  );
}
