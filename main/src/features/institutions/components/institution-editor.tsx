"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field, SaveBar, Select, Toggle } from "@/components/shared/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/shared/admin/page-seo-fields";
import { institutionPath } from "@/config/course-meta";
import { createInstitution, deleteInstitution, updateInstitution } from "@/features/institutions/actions";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";

const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

export type InstitutionValue = SeoValue & {
  id?: string;
  slug: string;
  name: string;
  logoId: string | null;
  destinationId: string | null;
  country: string;
  city: string;
  websiteUrl: string;
  descriptionHtml: string;
  isPartner: boolean;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
};

export function InstitutionEditor({
  value,
  media,
  destinations,
  canDelete,
  canPublish,
}: {
  value: InstitutionValue;
  media: Record<string, PickedMedia>;
  destinations: { id: string; name: string }[];
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [row, setRow] = useState<InstitutionValue>(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<InstitutionValue>) => setRow((current) => ({ ...current, ...patch }));
  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const path = institutionPath(row.slug);

  return (
    <form id="admin-institution-form"
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateInstitution(row) : await createInstitution(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/institutions/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <UnsavedGuard formId="admin-institution-form" />
      <Field
        label="Name"
        help="The name on the institution card, at the top of its page and on every course it runs."
        value={row.name}
        onChange={(name) => set({ name })}
        error={errors.name?.[0]}
      />

      <Field
        label="Web address"
        help={`This institution will live at ${path}. Changing it leaves a redirect behind so old links still work.`}
        value={row.slug}
        onChange={(slug) => set({ slug })}
        error={errors.slug?.[0]}
      />

      <MediaPicker
        label="Logo"
        name="logoId"
        value={pick(row.logoId)}
        help="Shown on the institution card, on the course pages and in the logo strip on the home page."
        onChange={(logoId) => set({ logoId })}
      />

      <Select
        label="Destination"
        help="Which study destination page this institution is listed under."
        value={row.destinationId ?? ""}
        onChange={(destinationId) => set({ destinationId: destinationId || null })}
        options={[
          { value: "", label: "Not set" },
          ...destinations.map((destination) => ({ value: destination.id, label: destination.name })),
        ]}
      />

      <Field
        label="Country"
        help="Shown on the institution card and used by the country filter on the courses page."
        value={row.country}
        onChange={(country) => set({ country })}
      />

      <Field
        label="City"
        help="Shown under the name on the institution page."
        value={row.city}
        onChange={(city) => set({ city })}
      />

      <Field
        label="Website"
        help="The Apply or Visit website link on the institution page. Must start with https://"
        value={row.websiteUrl}
        onChange={(websiteUrl) => set({ websiteUrl })}
        error={errors.websiteUrl?.[0]}
      />

      <RichText
        label="Description"
        help="The main body of the institution page, above the course list."
        value={row.descriptionHtml}
        onChange={(descriptionHtml) => set({ descriptionHtml })}
      />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <Toggle
        label="Partner institution"
        help="Ticked, the institution is shown as one Goodluck works with directly."
        checked={row.isPartner}
        onChange={(isPartner) => set({ isPartner })}
      />
      <Toggle
        label="Featured"
        help="Ticked, the institution is pulled to the front of the institutions page."
        checked={row.isFeatured}
        onChange={(isFeatured) => set({ isFeatured })}
      />
      <Field
        label="Order"
        type="number"
        help="Lower numbers come first on the institutions page."
        value={String(row.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />
      <Select
        label="Status"
        help="Only published institutions are on the site."
        value={row.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "draft", label: "Draft" },
          { value: "scheduled", label: "Scheduled", disabled: !canPublish },
          { value: "published", label: "Published", disabled: !canPublish },
          { value: "archived", label: "Archived" },
        ]}
      />

      <SeoFields
        value={row}
        onChange={set}
        path={path}
        fallbackTitle={row.name}
        fallbackDescription={row.city ? `${row.city}, ${row.country}` : row.country}
        ogImage={pick(row.seoOgImageId)}
        errors={errors}
      />

      <SaveBar
        busy={busy}
        message={message}
        problems={errors.publish}
        viewHref={path}
        onDelete={
          canDelete && row.id
            ? async () => {
                if (!confirm(`Delete ${row.name}? This cannot be undone.`)) return;
                setBusy(true);
                const result = await deleteInstitution({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/institutions");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
