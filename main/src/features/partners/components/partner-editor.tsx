"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPartner, deletePartner, updatePartner } from "@/features/partners/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field } from "@/components/shared/admin/seo-section";
import { Select } from "@/components/shared/admin/repeater";

export type PartnerValues = {
  id: string;
  name: string;
  websiteUrl: string;
  isFeatured: boolean;
  status: string;
};

export function PartnerEditor({
  values,
  logo,
  canPublish,
  canDelete,
}: {
  values: PartnerValues;
  logo: PickedMedia | null;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
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
          name: text("name"),
          logoId: text("logoId"),
          websiteUrl: text("websiteUrl"),
          isFeatured: form.get("isFeatured") === "on",
          status: canPublish ? text("status") : values.status || "draft",
        };

        const result = isNew
          ? await createPartner(payload)
          : await updatePartner({ ...payload, id: values.id });

        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && isNew) router.push(`/admin/partners/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field name="name" label="Partner name" defaultValue={values.name} error={errors.name?.[0]}
        help="Read out by screen readers in place of the logo on the home page." />
      <Field name="websiteUrl" label="Website" defaultValue={values.websiteUrl} error={errors.websiteUrl?.[0]}
        help="Where the logo links to. Must start with https://" />

      <MediaPicker
        label="Logo"
        name="logoId"
        value={logo}
        help="The logo in the scrolling row on the home page. It needs alt text before this partner can be published."
      />

      {canPublish ? (
        <Select
          label="Status"
          name="status"
          defaultValue={values.status || "draft"}
          help="Only published partners appear on the home page."
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
      ) : (
        <p className="t-small admin-help">Your role can save this partner but not publish it.</p>
      )}

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} /> Featured
        </span>
        <span className="t-small admin-help">Featured partners are shown first.</span>
      </label>

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
              if (!confirm(`Remove ${values.name} from the partner list?`)) return;
              setBusy(true);
              const result = await deletePartner({ id: values.id });
              setBusy(false);
              if (result.ok) router.push("/admin/partners");
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
