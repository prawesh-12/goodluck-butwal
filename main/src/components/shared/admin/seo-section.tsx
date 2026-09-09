"use client";

import { useState } from "react";
import { company } from "@/config/site";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";

export type SeoValues = {
  seoTitle: string;
  seoDescription: string;
  seoNoindex: boolean;
  canonicalUrl: string;
};

export function SeoSection({
  values,
  path,
  fallbackTitle,
  shareImage,
}: {
  values: SeoValues;
  path: string;
  fallbackTitle: string;
  shareImage: PickedMedia | null;
}) {
  const [title, setTitle] = useState(values.seoTitle);
  const [description, setDescription] = useState(values.seoDescription);

  return (
    <>
      <h2 className="t-h5 admin-subhead">Search engines</h2>

      <div className="admin-tile">
        <span className="t-small admin-help">This is how the page looks in Google results.</span>
        <span className="t-small">{`${company.url}${path}`}</span>
        <span className="t-body">{title || fallbackTitle}</span>
        <span className="t-small admin-help">
          {description || "No description yet, so Google will pick its own sentence from the page."}
        </span>
      </div>

      <label className="admin-field">
        <span className="t-small">Search title</span>
        <input name="seoTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        <span className="t-small admin-help">
          The blue line in Google results. Leave empty to use the name above. Around 60 characters,
          this one is {title.length}.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Search description</span>
        <textarea
          name="seoDescription"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="t-small admin-help">
          The grey sentence under the title in Google results. Around 155 characters, this one is{" "}
          {description.length}.
        </span>
      </label>

      <MediaPicker
        label="Share image"
        name="seoOgImageId"
        value={shareImage}
        help="Shown when someone posts this page to Facebook, LinkedIn or WhatsApp."
      />

      <label className="admin-field">
        <span className="t-small">Canonical address</span>
        <input name="canonicalUrl" defaultValue={values.canonicalUrl} />
        <span className="t-small admin-help">
          Only fill this in when the same content lives at another address. Must start with https://
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="seoNoindex" defaultChecked={values.seoNoindex} /> Keep out of
          search results
        </span>
        <span className="t-small admin-help">
          Ticked, the page still works on the site but Google is asked not to list it.
        </span>
      </label>
    </>
  );
}

export function Field({
  name,
  label,
  help,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  help?: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <input name={name} defaultValue={defaultValue} />
      {help ? <span className="t-small admin-help">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}
