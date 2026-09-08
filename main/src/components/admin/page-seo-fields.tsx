"use client";

import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker";
import { Field, TextArea, Toggle } from "@/components/admin/repeater";

export type SeoValue = {
  seoTitle: string;
  seoDescription: string;
  seoOgImageId: string | null;
  seoNoindex: boolean;
  canonicalUrl: string;
};

// Used by every entity that has its own address on the site.
export function SeoFields({
  value,
  onChange,
  path,
  fallbackTitle,
  fallbackDescription,
  ogImage,
  errors,
}: {
  value: SeoValue;
  onChange: (patch: Partial<SeoValue>) => void;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  ogImage: PickedMedia | null;
  errors?: Record<string, string[] | undefined>;
}) {
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/^https?:\/\//, "");
  const title = value.seoTitle || fallbackTitle || "Untitled";
  const description = value.seoDescription || fallbackDescription || "No description yet.";

  return (
    <>
      <h2 className="t-h5 admin-subhead">Search engines</h2>

      <div className="admin-message">
        <p className="t-small admin-help">{host}{path}</p>
        <p className="t-body">{title}</p>
        <p className="t-small">{description.slice(0, 160)}</p>
      </div>

      <Field
        label="Search title"
        help="The blue line in a Google result. Left empty, the page title is used."
        value={value.seoTitle}
        onChange={(seoTitle) => onChange({ seoTitle })}
        error={errors?.seoTitle?.[0]}
      />
      <p className="t-small admin-help">{value.seoTitle.length} of 70 characters</p>

      <TextArea
        label="Search description"
        help="The grey sentence under the blue line in a Google result."
        rows={3}
        value={value.seoDescription}
        onChange={(seoDescription) => onChange({ seoDescription })}
        error={errors?.seoDescription?.[0]}
      />
      <p className="t-small admin-help">{value.seoDescription.length} of 160 characters</p>

      <MediaPicker
        label="Share image"
        name="seoOgImageId"
        value={ogImage}
        help="The picture that shows when someone shares this address on Facebook, LinkedIn or WhatsApp."
        onChange={(seoOgImageId) => onChange({ seoOgImageId })}
      />

      <Field
        label="Canonical address"
        help="Leave empty unless this content also lives at another address. Must start with https://"
        value={value.canonicalUrl}
        onChange={(canonicalUrl) => onChange({ canonicalUrl })}
        error={errors?.canonicalUrl?.[0]}
      />

      <Toggle
        label="Hide from search engines"
        help="Ticked, Google is asked not to list this address at all."
        checked={value.seoNoindex}
        onChange={(seoNoindex) => onChange({ seoNoindex })}
      />
    </>
  );
}
