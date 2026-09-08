"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CONSENT_REQUIRED,
  requiredFieldsFor,
  testimonialTypes,
  videoProviders,
  type TestimonialType,
} from "@/lib/validators/testimonial";
import {
  archiveTestimonial,
  createTestimonial,
  updateTestimonial,
} from "@/server/actions/testimonials";
import { MediaPicker, type PickedMedia } from "./media-picker";
import type { EditorialOptions } from "@/server/queries/admin-editorial";

const RichText = dynamic(() => import("./editor-rich-text"), { ssr: false });

export type TestimonialValues = {
  id?: string;
  type: TestimonialType;
  authorName: string;
  displayName: string;
  isAnonymised: boolean;
  authorPhotoId: string;
  authorLocation: string;
  quote: string;
  bodyHtml: string;
  imageId: string;
  videoUrl: string;
  videoProvider: string;
  destinationId: string;
  institutionId: string;
  serviceId: string;
  officeId: string;
  rating: number | null;
  isFeatured: boolean;
  consentGiven: boolean;
  consentNote: string;
  status: string;
  publishedAt: string;
};

type FieldErrors = Record<string, string[] | undefined>;

export function TestimonialForm({
  values,
  options,
  photo,
  image,
  canPublish,
  canDelete,
}: {
  values: TestimonialValues;
  options: EditorialOptions;
  photo: PickedMedia | null;
  image: PickedMedia | null;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState<TestimonialType>(values.type);
  const [anonymised, setAnonymised] = useState(values.isAnonymised);
  const [consent, setConsent] = useState(values.consentGiven);
  const [status, setStatus] = useState(values.status);
  const [quote, setQuote] = useState(values.quote);
  const [body, setBody] = useState(values.bodyHtml);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const statuses = canPublish
    ? ["draft", "scheduled", "published", "archived"]
    : ["draft", "archived"];
  const needed = requiredFieldsFor(type)
    .map((need) => need.label)
    .join(" and ");

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const rating = String(form.get("rating") ?? "");
        const payload = {
          ...(values.id ? { id: values.id } : {}),
          type,
          authorName: String(form.get("authorName") ?? ""),
          displayName: String(form.get("displayName") ?? ""),
          isAnonymised: anonymised,
          authorPhotoId: anonymised ? "" : String(form.get("authorPhotoId") ?? ""),
          authorLocation: String(form.get("authorLocation") ?? ""),
          quote,
          bodyHtml: body,
          imageId: String(form.get("imageId") ?? ""),
          videoUrl: String(form.get("videoUrl") ?? ""),
          videoProvider: String(form.get("videoProvider") ?? ""),
          destinationId: String(form.get("destinationId") ?? ""),
          institutionId: String(form.get("institutionId") ?? ""),
          serviceId: String(form.get("serviceId") ?? ""),
          officeId: String(form.get("officeId") ?? ""),
          rating: rating ? Number(rating) : null,
          isFeatured: form.get("isFeatured") === "on",
          consentGiven: consent,
          consentNote: String(form.get("consentNote") ?? ""),
          status,
          publishedAt: String(form.get("publishedAt") ?? ""),
        };

        const result = values.id ? await updateTestimonial(payload) : await createTestimonial(payload);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (!result.ok) return;
        if (values.id) router.refresh();
        else router.push(`/admin/testimonials/${result.data.id}`);
      }}
    >
      <label className="admin-field">
        <span className="t-small">Kind of story</span>
        <select value={type} onChange={(event) => setType(event.target.value as TestimonialType)}>
          {testimonialTypes.map((option) => (
            <option key={option} value={option}>
              {option === "text" ? "Written review" : option === "image" ? "Success graphic" : "Video"}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">
          Written reviews sit on the home page. Graphics and videos sit on the success stories page.
          This kind needs {needed}.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Real name</span>
        <input name="authorName" defaultValue={values.authorName} />
        <span className="t-small admin-help">Staff only. It is never shown on the site.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">
          <input
            type="checkbox"
            checked={anonymised}
            onChange={(event) => setAnonymised(event.target.checked)}
          />{" "}
          Keep this person anonymous
        </span>
        <span className="t-small admin-help">
          {anonymised
            ? "The real name and the photo will not appear anywhere on the site. Only the shown name below is public."
            : "Tick this when the person agreed to the words but not to their name or face."}
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Name shown on the site</span>
        <input name="displayName" defaultValue={values.displayName} />
        <span className="t-small admin-help">
          What visitors read above the quote, such as a first name and an initial.
        </span>
        {errors.displayName ? <span className="t-small admin-error">{errors.displayName[0]}</span> : null}
      </label>

      {anonymised ? null : (
        <MediaPicker
          label="Photo"
          name="authorPhotoId"
          value={photo}
          help="The round picture beside the quote on the home page."
        />
      )}

      <label className="admin-field">
        <span className="t-small">Where they are from</span>
        <input name="authorLocation" defaultValue={values.authorLocation} />
        <span className="t-small admin-help">Shown under the name, such as Kathmandu or Melbourne.</span>
      </label>

      {type === "text" ? (
        <label className="admin-field">
          <span className="t-small">Quote</span>
          <textarea value={quote} onChange={(event) => setQuote(event.target.value)} rows={4} />
          <span className="t-small admin-help">The words in the review card. Keep it to a few sentences.</span>
          {errors.quote ? <span className="t-small admin-error">{errors.quote[0]}</span> : null}
        </label>
      ) : null}

      {type === "image" ? (
        <>
          <MediaPicker
            label="Success graphic"
            name="imageId"
            value={image}
            help="The card on the success stories page."
          />
          {errors.imageId ? <span className="t-small admin-error">{errors.imageId[0]}</span> : null}
        </>
      ) : null}

      {type === "video" ? (
        <>
          <label className="admin-field">
            <span className="t-small">Video link</span>
            <input name="videoUrl" defaultValue={values.videoUrl} />
            <span className="t-small admin-help">
              The web address of the video. It plays in the pop-up on the success stories page.
            </span>
            {errors.videoUrl ? <span className="t-small admin-error">{errors.videoUrl[0]}</span> : null}
          </label>

          <label className="admin-field">
            <span className="t-small">Where the video lives</span>
            <select name="videoProvider" defaultValue={values.videoProvider}>
              <option value="">Not set</option>
              {videoProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            <span className="t-small admin-help">Decides how the player is embedded.</span>
            {errors.videoProvider ? (
              <span className="t-small admin-error">{errors.videoProvider[0]}</span>
            ) : null}
          </label>
        </>
      ) : null}

      <RichText
        label="Longer story"
        help="Optional. Shown under the quote when the story has its own space on the page."
        value={values.bodyHtml}
        onChange={setBody}
      />

      <label className="admin-field">
        <span className="t-small">Destination</span>
        <select name="destinationId" defaultValue={values.destinationId}>
          <option value="">Not set</option>
          {options.destinations.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">Shows the story on that study destination page.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Institution</span>
        <select name="institutionId" defaultValue={values.institutionId}>
          <option value="">Not set</option>
          {options.institutions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">Shows the story on that institution page.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Service</span>
        <select name="serviceId" defaultValue={values.serviceId}>
          <option value="">Not set</option>
          {options.services.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">Shows the story on that service page.</span>
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
        <span className="t-small admin-help">Leave it on both unless only one office should show it.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Rating</span>
        <select name="rating" defaultValue={values.rating ? String(values.rating) : ""}>
          <option value="">Not set</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">The stars on the review card.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} /> Feature this
          story
        </span>
        <span className="t-small admin-help">Featured stories come first on the home page.</span>
      </label>

      <h2 className="t-h5 admin-subhead">Consent</h2>

      <label className="admin-field">
        <span className="t-small">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />{" "}
          This person agreed to their story being published
        </span>
        <span className="t-small admin-help">
          {consent ? "Recorded. The story can go live." : CONSENT_REQUIRED}
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">How consent was given</span>
        <textarea name="consentNote" defaultValue={values.consentNote} rows={2} />
        <span className="t-small admin-help">
          Staff only, never shown on the site. Note the date and whether it was by email or in person.
        </span>
      </label>

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
            : "You can save drafts. An admin puts the story live."}
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Go live at</span>
        <input type="datetime-local" name="publishedAt" defaultValue={values.publishedAt} />
        <span className="t-small admin-help">
          A scheduled story needs a time in the future, in UTC, and goes live within fifteen minutes
          of it.
        </span>
        {errors.publishedAt ? <span className="t-small admin-error">{errors.publishedAt[0]}</span> : null}
      </label>

      <div className="admin-actions">
        <button type="submit" className="btn-black-sm" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>

        <Link className="btn-black-sm" href="/success-stories" target="_blank">
          View on site
        </Link>

        {values.id && canDelete ? (
          <button
            type="button"
            className="btn-black-sm"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Take this story off the site? It stays here as archived.")) return;
              setBusy(true);
              const result = await archiveTestimonial({ id: values.id });
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
