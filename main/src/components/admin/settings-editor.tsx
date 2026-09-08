"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/server/actions/settings";
import type { SettingsValues } from "@/lib/content-meta";

type FieldErrors = Record<string, string[] | undefined>;

export function SettingsEditor({ values, readOnly }: { values: SettingsValues; readOnly: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const result = await updateSettings({
          site_name: form.get("site_name"),
          default_seo_title: form.get("default_seo_title"),
          default_seo_description: form.get("default_seo_description"),
          default_og_image_id: form.get("default_og_image_id"),
          social_links: values.social_links.map((link, index) => ({
            label: form.get(`social_label_${index}`),
            href: form.get(`social_href_${index}`),
            icon: link.icon,
          })),
          notify_email_au: form.get("notify_email_au"),
          notify_email_np: form.get("notify_email_np"),
          ga4_id: form.get("ga4_id"),
          gtm_id: form.get("gtm_id"),
          announcement_bar: form.get("announcement_bar"),
          google_rating: form.get("google_rating"),
          google_review_count: form.get("google_review_count"),
        });
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">Site</h2>
      <Field
        name="site_name"
        label="Site name"
        help="Used in page titles and in email footers."
        defaultValue={values.site_name}
        readOnly={readOnly}
        error={errors.site_name?.[0]}
      />

      <h2 className="t-h5 admin-subhead">SEO defaults</h2>
      <Field
        name="default_seo_title"
        label="Default title"
        help="Shown when a page has no title of its own."
        defaultValue={values.default_seo_title}
        readOnly={readOnly}
        error={errors.default_seo_title?.[0]}
      />
      <Field
        name="default_seo_description"
        label="Default description"
        help="The sentence search engines show when a page has none."
        defaultValue={values.default_seo_description}
        readOnly={readOnly}
        error={errors.default_seo_description?.[0]}
      />
      <Field
        name="default_og_image_id"
        label="Default share image"
        help="The media library id of the image used when a page is shared."
        defaultValue={values.default_og_image_id}
        readOnly={readOnly}
        error={errors.default_og_image_id?.[0]}
      />

      <h2 className="t-h5 admin-subhead">Social links</h2>
      {values.social_links.length === 0 ? (
        <p className="t-body admin-empty">No social links yet.</p>
      ) : (
        values.social_links.map((link, index) => (
          <div key={link.icon || index}>
            <Field
              name={`social_label_${index}`}
              label={`Link ${index + 1} name`}
              defaultValue={link.label}
              readOnly={readOnly}
            />
            <Field
              name={`social_href_${index}`}
              label={`Link ${index + 1} address`}
              help="Must start with https://"
              defaultValue={link.href}
              readOnly={readOnly}
            />
          </div>
        ))
      )}
      {errors.social_links ? <span className="admin-clash">{errors.social_links[0]}</span> : null}

      <h2 className="t-h5 admin-subhead">Notification emails</h2>
      <Field
        name="notify_email_au"
        label="Australia"
        help="Enquiries and bookings for the Australia office go here."
        defaultValue={values.notify_email_au}
        readOnly={readOnly}
        error={errors.notify_email_au?.[0]}
      />
      <Field
        name="notify_email_np"
        label="Nepal"
        help="Enquiries and bookings for the Nepal office go here."
        defaultValue={values.notify_email_np}
        readOnly={readOnly}
        error={errors.notify_email_np?.[0]}
      />

      <h2 className="t-h5 admin-subhead">Analytics IDs</h2>
      <Field
        name="ga4_id"
        label="Google Analytics"
        help="Leave empty to turn analytics off."
        defaultValue={values.ga4_id}
        readOnly={readOnly}
        error={errors.ga4_id?.[0]}
      />
      <Field
        name="gtm_id"
        label="Google Tag Manager"
        help="Leave empty to turn tag manager off."
        defaultValue={values.gtm_id}
        readOnly={readOnly}
        error={errors.gtm_id?.[0]}
      />

      <h2 className="t-h5 admin-subhead">Announcement bar</h2>
      <Field
        name="announcement_bar"
        label="Message"
        help="Leave empty to hide the bar."
        defaultValue={values.announcement_bar}
        readOnly={readOnly}
        error={errors.announcement_bar?.[0]}
      />

      <h2 className="t-h5 admin-subhead">Google rating</h2>
      <Field
        name="google_rating"
        label="Score"
        help="Between 0 and 5, like 4.8."
        defaultValue={values.google_rating}
        readOnly={readOnly}
        error={errors.google_rating?.[0]}
      />
      <Field
        name="google_review_count"
        label="Number of reviews"
        defaultValue={String(values.google_review_count)}
        readOnly={readOnly}
        error={errors.google_review_count?.[0]}
      />

      <div className="admin-actions">
        {readOnly ? (
          <span className="t-small">Only a super admin can change these.</span>
        ) : (
          <button type="submit" className="btn-black-sm" disabled={busy}>
            {busy ? "Saving" : "Save"}
          </button>
        )}
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  help,
  defaultValue,
  readOnly,
  error,
}: {
  name: string;
  label: string;
  help?: string;
  defaultValue: string;
  readOnly: boolean;
  error?: string;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <input name={name} defaultValue={defaultValue} readOnly={readOnly} />
      {help ? <span className="t-small">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}
