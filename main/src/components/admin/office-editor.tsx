"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOffice } from "@/server/actions/offices";
import { DAY_NAMES } from "@/lib/content-meta";
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker";
import { Field, SeoSection } from "@/components/admin/seo-section";

type Hours = { day: number; open: string; close: string; closed: boolean };

export type OfficeValues = {
  id: string;
  slug: string;
  name: string;
  country: string;
  timezone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  openingHours: Hours[];
  profileHtml: string;
  credentialsHtml: string;
  isActive: boolean;
  status: string;
  seoTitle: string;
  seoDescription: string;
  seoNoindex: boolean;
  canonicalUrl: string;
};

const emptyWeek: Hours[] = DAY_NAMES.map((_, day) => ({ day, open: "09:00", close: "17:00", closed: true }));

export function OfficeEditor({
  values,
  heroImage,
  shareImage,
  canPublish,
}: {
  values: OfficeValues;
  heroImage: PickedMedia | null;
  shareImage: PickedMedia | null;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [hours, setHours] = useState<Hours[]>(
    values.openingHours.length === 7 ? values.openingHours : emptyWeek,
  );
  const [embed, setEmbed] = useState(values.mapsEmbedUrl);

  const setDay = (day: number, patch: Partial<Hours>) =>
    setHours((rows) => rows.map((row) => (row.day === day ? { ...row, ...patch } : row)));

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "");
        const result = await updateOffice({
          id: values.id,
          slug: text("slug"),
          name: text("name"),
          country: text("country"),
          timezone: text("timezone"),
          addressLine1: text("addressLine1"),
          addressLine2: text("addressLine2"),
          city: text("city"),
          state: text("state"),
          postcode: text("postcode"),
          phone: text("phone"),
          phoneDisplay: text("phoneDisplay"),
          whatsapp: text("whatsapp"),
          email: text("email"),
          mapsUrl: text("mapsUrl"),
          mapsEmbedUrl: text("mapsEmbedUrl"),
          openingHours: hours,
          profileHtml: text("profileHtml"),
          credentialsHtml: text("credentialsHtml"),
          heroImageId: text("heroImageId"),
          isActive: form.get("isActive") === "on",
          status: canPublish ? text("status") : values.status,
          seoTitle: text("seoTitle"),
          seoDescription: text("seoDescription"),
          seoOgImageId: text("seoOgImageId"),
          seoNoindex: form.get("seoNoindex") === "on",
          canonicalUrl: text("canonicalUrl"),
        });
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">The office</h2>

      <Field name="name" label="Office name" defaultValue={values.name} error={errors.name?.[0]}
        help="Shown on the contact page, in the office switcher and at the foot of every email." />
      <Field name="slug" label="Address on the site" defaultValue={values.slug} error={errors.slug?.[0]}
        help="The last part of this office's own web address. Changing it leaves a forwarding rule behind." />
      <Field name="country" label="Country" defaultValue={values.country} error={errors.country?.[0]}
        help="Names the flag shown next to the office." />
      <Field name="timezone" label="Time zone" defaultValue={values.timezone} error={errors.timezone?.[0]}
        help="Used to show booking times in the office's own clock, like Australia/Melbourne." />

      <h2 className="t-h5 admin-subhead">Where it is</h2>

      <Field name="addressLine1" label="Street address" defaultValue={values.addressLine1} error={errors.addressLine1?.[0]}
        help="First line of the address on the contact cards." />
      <Field name="addressLine2" label="Second address line" defaultValue={values.addressLine2}
        help="Level or suite number, if there is one." />
      <Field name="city" label="City" defaultValue={values.city} error={errors.city?.[0]}
        help="Shown next to the office name everywhere the office is listed." />
      <Field name="state" label="State" defaultValue={values.state} help="Part of the postal address." />
      <Field name="postcode" label="Postcode" defaultValue={values.postcode} help="Part of the postal address." />

      <h2 className="t-h5 admin-subhead">How people reach it</h2>

      <Field name="phone" label="Phone number for dialling" defaultValue={values.phone} error={errors.phone?.[0]}
        help="What the call button dials. International form, like +61390000000." />
      <Field name="phoneDisplay" label="Phone number as written" defaultValue={values.phoneDisplay} error={errors.phoneDisplay?.[0]}
        help="How the number is printed in the header, footer and contact cards." />
      <Field name="whatsapp" label="WhatsApp number" defaultValue={values.whatsapp} error={errors.whatsapp?.[0]}
        help="Used by the WhatsApp button. International form. Leave empty to hide it." />
      <Field name="email" label="Email address" defaultValue={values.email} error={errors.email?.[0]}
        help="Shown on the contact page and used as the reply address on enquiries." />

      <h2 className="t-h5 admin-subhead">Opening hours</h2>
      <p className="t-small admin-help">
        One row per day. These become the opening line on the contact cards. Tick Closed and the day
        is left out.
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Opens</th>
            <th>Closes</th>
            <th>Closed</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((row) => (
            <tr key={row.day}>
              <td>{DAY_NAMES[row.day]}</td>
              <td>
                <label className="admin-field">
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES[row.day]} opens`}
                    value={row.open}
                    disabled={row.closed}
                    onChange={(e) => setDay(row.day, { open: e.target.value })}
                  />
                </label>
              </td>
              <td>
                <label className="admin-field">
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES[row.day]} closes`}
                    value={row.close}
                    disabled={row.closed}
                    onChange={(e) => setDay(row.day, { close: e.target.value })}
                  />
                </label>
              </td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`${DAY_NAMES[row.day]} closed`}
                  checked={row.closed}
                  onChange={(e) => setDay(row.day, { closed: e.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.openingHours ? <span className="admin-clash">{errors.openingHours[0]}</span> : null}

      <h2 className="t-h5 admin-subhead">Map</h2>

      <Field name="mapsUrl" label="Link to Google Maps" defaultValue={values.mapsUrl} error={errors.mapsUrl?.[0]}
        help="Where the Get directions link goes. Must start with https://" />
      <label className="admin-field">
        <span className="t-small">Map to show on the page</span>
        <input name="mapsEmbedUrl" value={embed} onChange={(e) => setEmbed(e.target.value)} />
        <span className="t-small admin-help">
          In Google Maps choose Share, then Embed a map, then copy the address inside src=&quot;...&quot;.
          The map below is what visitors will see.
          Without this there is no map on the page, only the Get directions link.
        </span>
        {errors.mapsEmbedUrl ? <span className="admin-clash">{errors.mapsEmbedUrl[0]}</span> : null}
      </label>

      {embed.startsWith("https://") ? (
        <iframe title="Map preview" src={embed} width="100%" height="260" loading="lazy" />
      ) : (
        <p className="t-small admin-empty">No map yet. Paste an address above to see it here.</p>
      )}

      <h2 className="t-h5 admin-subhead">About this office</h2>

      <label className="admin-field">
        <span className="t-small">Office profile</span>
        <textarea name="profileHtml" rows={6} defaultValue={values.profileHtml} />
        <span className="t-small admin-help">
          The paragraphs on this office&apos;s own page. Anything other than simple formatting is
          removed when you save.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Registrations and memberships</span>
        <textarea name="credentialsHtml" rows={4} defaultValue={values.credentialsHtml} />
        <span className="t-small admin-help">
          MARA, ICEF and agent codes. Shown under the office profile.
        </span>
      </label>

      <MediaPicker
        label="Hero image"
        name="heroImageId"
        value={heroImage}
        help="The wide picture at the top of this office's page."
      />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      {canPublish ? (
        <label className="admin-field">
          <span className="t-small">Status</span>
          <select name="status" defaultValue={values.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <span className="t-small admin-help">
            Only a published office appears on the site. An office cannot be published while
            anything above is missing.
          </span>
        </label>
      ) : (
        <p className="t-small admin-help">
          This office is {values.status}. Only a super admin can change that.
        </p>
      )}

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="isActive" defaultChecked={values.isActive} /> Open for business
        </span>
        <span className="t-small admin-help">
          Untick while an office is closed. It stays on the site but stops being offered on the
          booking form.
        </span>
      </label>

      <SeoSection
        values={{
          seoTitle: values.seoTitle,
          seoDescription: values.seoDescription,
          seoNoindex: values.seoNoindex,
          canonicalUrl: values.canonicalUrl,
        }}
        path={`/offices/${values.slug}`}
        fallbackTitle={values.name}
        shareImage={shareImage}
      />

      <div className="admin-actions">
        <button type="submit" className="btn-black-sm" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
