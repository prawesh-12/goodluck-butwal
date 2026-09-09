"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/features/team/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field, SeoSection } from "@/components/shared/admin/seo-section";
import { Select } from "@/components/shared/admin/repeater";
import type { OfficeOption } from "@/components/shared/admin/content-filters";

export type TeamValues = {
  id: string;
  officeId: string;
  slug: string;
  fullName: string;
  position: string;
  bioHtml: string;
  qualifications: string[];
  expertise: string[];
  email: string;
  phone: string;
  linkedinUrl: string;
  isCoFounder: boolean;
  isFeatured: boolean;
  status: string;
  seoTitle: string;
  seoDescription: string;
  seoNoindex: boolean;
  canonicalUrl: string;
};

export function TeamEditor({
  values,
  photo,
  shareImage,
  offices,
  canPublish,
  canDelete,
}: {
  values: TeamValues;
  photo: PickedMedia | null;
  shareImage: PickedMedia | null;
  offices: OfficeOption[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [qualifications, setQualifications] = useState(values.qualifications);
  const [expertise, setExpertise] = useState(values.expertise);
  const isNew = values.id === "";

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "");
        const payload = {
          officeId: text("officeId"),
          slug: text("slug"),
          fullName: text("fullName"),
          position: text("position"),
          photoId: text("photoId"),
          bioHtml: text("bioHtml"),
          qualifications,
          expertise,
          email: text("email"),
          phone: text("phone"),
          linkedinUrl: text("linkedinUrl"),
          isCoFounder: form.get("isCoFounder") === "on",
          isFeatured: form.get("isFeatured") === "on",
          status: canPublish ? text("status") : values.status || "draft",
          seoTitle: text("seoTitle"),
          seoDescription: text("seoDescription"),
          seoOgImageId: text("seoOgImageId"),
          seoNoindex: form.get("seoNoindex") === "on",
          canonicalUrl: text("canonicalUrl"),
        };

        const result = isNew
          ? await createTeamMember(payload)
          : await updateTeamMember({ ...payload, id: values.id });

        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && isNew) router.push(`/admin/team/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">The person</h2>

      <Field name="fullName" label="Full name" defaultValue={values.fullName} error={errors.fullName?.[0]}
        help="Printed under the photo on the team page." />
      <Field name="position" label="Position" defaultValue={values.position} error={errors.position?.[0]}
        help="The line under the name on the team page, like Migration Agent." />
      <Field name="slug" label="Address on the site" defaultValue={values.slug} error={errors.slug?.[0]}
        help="The last part of this person's own web address. Leave empty and it is made from the name." />

      <Select
        label="Office"
        name="officeId"
        defaultValue={values.officeId}
        help="Which office the person is listed under on the team page."
        error={errors.officeId?.[0]}
        options={[
          { value: "", label: "No office" },
          ...offices.map((office) => ({ value: office.id, label: office.name })),
        ]}
      />

      <MediaPicker
        label="Photo"
        name="photoId"
        value={photo}
        help="The headshot on the team page. It needs alt text before this person can be published."
      />

      <label className="admin-field">
        <span className="t-small">Biography</span>
        <textarea name="bioHtml" rows={6} defaultValue={values.bioHtml} />
        <span className="t-small admin-help">
          The paragraphs on this person&apos;s own page. Leave empty until the client sends the text.
        </span>
      </label>

      <TagInput
        label="Qualifications"
        values={qualifications}
        onChange={setQualifications}
        help="Listed on this person's page. Type one and press Enter, like MARA 1234567."
      />
      <TagInput
        label="Areas of expertise"
        values={expertise}
        onChange={setExpertise}
        help="Listed on this person's page. Type one and press Enter, like Student visas."
      />

      <h2 className="t-h5 admin-subhead">How people reach them</h2>

      <Field name="email" label="Email address" defaultValue={values.email} error={errors.email?.[0]}
        help="Shown on this person's page. Leave empty to hide it." />
      <Field name="phone" label="Phone number" defaultValue={values.phone} error={errors.phone?.[0]}
        help="Shown on this person's page. International form, like +61390000000." />
      <Field name="linkedinUrl" label="LinkedIn" defaultValue={values.linkedinUrl} error={errors.linkedinUrl?.[0]}
        help="The LinkedIn button on this person's page. Must start with https://" />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      {canPublish ? (
        <Select
          label="Status"
          name="status"
          defaultValue={values.status || "draft"}
          help="Only published people appear on the team page. Publishing is refused while anything above is missing."
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
      ) : (
        <p className="t-small admin-help">Your role can save this person but not publish them.</p>
      )}

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="isCoFounder" defaultChecked={values.isCoFounder} /> Co-founder
        </span>
        <span className="t-small admin-help">
          Co-founders are the two people shown on the message from the co-founders page.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} /> Featured
        </span>
        <span className="t-small admin-help">Featured people are shown first on the team page.</span>
      </label>

      <SeoSection
        values={{
          seoTitle: values.seoTitle,
          seoDescription: values.seoDescription,
          seoNoindex: values.seoNoindex,
          canonicalUrl: values.canonicalUrl,
        }}
        path={`/team/${values.slug || "new-person"}`}
        fallbackTitle={values.fullName || "New team member"}
        shareImage={shareImage}
      />

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>

        {!isNew && canDelete ? (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm(`Remove ${values.fullName} from the team list?`)) return;
              setBusy(true);
              const result = await deleteTeamMember({ id: values.id });
              setBusy(false);
              if (result.ok) router.push("/admin/team");
              else setMessage(result.error);
            }}
          >
            Delete
          </button>
        ) : null}

        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}

function TagInput({
  label,
  values,
  onChange,
  help,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  help: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="admin-field">
      <span className="t-small">{label}</span>

      <div className="admin-actions">
        {values.length === 0 ? <span className="t-small admin-empty">None yet.</span> : null}
        {values.map((value) => (
          <span key={value} className="admin-badge">
            {value}{" "}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== ",") return;
          // Enter inside a form would submit it, and a comma is how people type lists.
          e.preventDefault();
          add();
        }}
        onBlur={add}
      />
      <span className="t-small admin-help">{help}</span>
    </div>
  );
}
