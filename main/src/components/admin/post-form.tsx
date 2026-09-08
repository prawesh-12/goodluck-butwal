"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { company } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { EXCERPT_MAX } from "@/lib/content-meta";
import { archivePost, createPost, updatePost } from "@/server/actions/posts";
import { MediaPicker, type PickedMedia } from "./media-picker";
import { SeoFields, type SeoValue } from "./page-seo-fields";
import type { EditorialOptions } from "@/server/queries/admin-editorial";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

// Tiptap is a large dependency and belongs only in the browser, so the Worker never bundles it.
const RichText = dynamic(() => import("./editor-rich-text"), { ssr: false });

export type PostValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  bannerImageId: string;
  categoryId: string;
  officeId: string;
  destinationId: string;
  tagIds: string[];
  authorDisplayName: string;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  seoOgImageId: string;
  seoNoindex: boolean;
  canonicalUrl: string;
};

type FieldErrors = Record<string, string[] | undefined>;

export function PostForm({
  values,
  options,
  banner,
  shareImage,
  canPublish,
  canDelete,
}: {
  values: PostValues;
  options: EditorialOptions;
  banner: PickedMedia | null;
  shareImage: PickedMedia | null;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id));
  const [excerpt, setExcerpt] = useState(values.excerpt);
  const [body, setBody] = useState(values.bodyHtml);
  const [status, setStatus] = useState(values.status);
  const [seo, setSeo] = useState<SeoValue>({
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    seoOgImageId: values.seoOgImageId || null,
    seoNoindex: values.seoNoindex,
    canonicalUrl: values.canonicalUrl,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const statuses = canPublish
    ? ["draft", "scheduled", "published", "archived"]
    : ["draft", "archived"];

  return (
    <form id="admin-post-form"
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const payload = {
          ...(values.id ? { id: values.id } : {}),
          title,
          slug,
          excerpt,
          bodyHtml: body,
          bannerImageId: String(form.get("bannerImageId") ?? ""),
          categoryId: String(form.get("categoryId") ?? ""),
          officeId: String(form.get("officeId") ?? ""),
          destinationId: String(form.get("destinationId") ?? ""),
          tagIds: form.getAll("tagIds").map(String),
          authorDisplayName: String(form.get("authorDisplayName") ?? ""),
          status,
          publishedAt: String(form.get("publishedAt") ?? ""),
          seoTitle: seo.seoTitle,
          seoDescription: seo.seoDescription,
          seoOgImageId: seo.seoOgImageId ?? "",
          seoNoindex: seo.seoNoindex,
          canonicalUrl: seo.canonicalUrl,
        };

        const result = values.id ? await updatePost(payload) : await createPost(payload);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (!result.ok) return;
        if (values.id) router.refresh();
        else router.push(`/admin/posts/${result.data.id}`);
      }}
    >
      <UnsavedGuard formId="admin-post-form" />
      <label className="admin-field">
        <span className="t-small">Title</span>
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <span className="t-small admin-help">The headline on the article and in the news list.</span>
        {errors.title ? <span className="t-small admin-error">{errors.title[0]}</span> : null}
      </label>

      <label className="admin-field">
        <span className="t-small">Web address</span>
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
        <span className="t-small admin-help">
          The article lives at {company.url}/news/{slug || "..."}. Changing it on a published post
          leaves a redirect behind, so old links keep working.
        </span>
        {errors.slug ? <span className="t-small admin-error">{errors.slug[0]}</span> : null}
      </label>

      <label className="admin-field">
        <span className="t-small">Excerpt</span>
        <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} />
        <span className="t-small admin-help">
          The summary under the title on the news list and in search results. {excerpt.length} of{" "}
          {EXCERPT_MAX} characters.
        </span>
        {errors.excerpt ? <span className="t-small admin-error">{errors.excerpt[0]}</span> : null}
      </label>

      <RichText
        label="Body"
        help="Everything on the article page under the banner."
        value={values.bodyHtml}
        onChange={setBody}
      />

      <MediaPicker
        label="Banner image"
        name="bannerImageId"
        value={banner}
        help="The wide picture at the top of the article and on its news card."
      />

      <label className="admin-field">
        <span className="t-small">Category</span>
        <select name="categoryId" defaultValue={values.categoryId}>
          <option value="">Not set</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">The label on the news card and the filter it sits under.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Tags</span>
        <select name="tagIds" multiple defaultValue={values.tagIds} size={6}>
          {options.tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">
          Shown at the foot of the article. Hold Ctrl, or Command on a Mac, to pick more than one.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Office</span>
        <select name="officeId" defaultValue={values.officeId}>
          <option value="">Both offices</option>
          {options.offices.map((office) => (
            <option key={office.id} value={office.id}>
              {office.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">Leave it on both unless the article is only about one office.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Destination</span>
        <select name="destinationId" defaultValue={values.destinationId}>
          <option value="">Not about one country</option>
          {options.destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">Links the article to that study destination page.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Author shown</span>
        <input name="authorDisplayName" defaultValue={values.authorDisplayName} />
        <span className="t-small admin-help">The by-line on the article. Leave it empty for no by-line.</span>
      </label>

      <SeoFields
        value={seo}
        onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
        path={`/news/${slug || "..."}`}
        fallbackTitle={title}
        fallbackDescription={excerpt}
        ogImage={shareImage}
        errors={errors}
      />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <label className="admin-field">
        <span className="t-small">Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">
          {canPublish
            ? "Draft is invisible. Scheduled goes live on its own. Archived comes off the site."
            : "You can save drafts. An admin puts the article live."}
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Go live at</span>
        <input type="datetime-local" name="publishedAt" defaultValue={values.publishedAt} />
        <span className="t-small admin-help">
          The date shown on the article. A scheduled article needs a time in the future, in UTC, and
          goes live within fifteen minutes of it.
        </span>
        {errors.publishedAt ? <span className="t-small admin-error">{errors.publishedAt[0]}</span> : null}
      </label>

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>

        {values.id ? (
          <Link className="admin-btn" href={`/news/${values.slug}`} target="_blank">
            View on site
          </Link>
        ) : null}

        {values.id && canDelete ? (
          <button
            type="button"
            className="admin-btn"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Take this article off the site? It stays here as archived.")) return;
              setBusy(true);
              const result = await archivePost({ id: values.id });
              setBusy(false);
              setMessage(result.ok ? "Archived." : result.error);
              if (result.ok) router.refresh();
            }}
          >
            Archive
          </button>
        ) : null}

        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
