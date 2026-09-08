"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { company } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { eventTypeLabels, eventTypes, type EventType } from "@/lib/content-meta";
import { archiveEvent, createEvent, updateEvent } from "@/server/actions/events";
import { MediaPicker, type PickedMedia } from "./media-picker";
import { SeoFields, type SeoValue } from "./page-seo-fields";
import type { OfficeZone } from "@/server/queries/admin-events";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { mapsEmbedSrc } from "@/lib/maps";

const RichText = dynamic(() => import("./editor-rich-text"), { ssr: false });

export type EventValues = {
  id?: string;
  title: string;
  slug: string;
  eventType: EventType;
  officeId: string;
  summary: string;
  descriptionHtml: string;
  coverImageId: string;
  startsAt: string;
  endsAt: string;
  isOnline: boolean;
  onlineUrl: string;
  venueName: string;
  venueAddress: string;
  mapsEmbedUrl: string;
  capacity: number | null;
  registrationEnabled: boolean;
  registrationDeadline: string;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  seoOgImageId: string;
  seoNoindex: boolean;
  canonicalUrl: string;
};

type FieldErrors = Record<string, string[] | undefined>;

export function EventForm({
  values,
  offices,
  cover,
  shareImage,
  seatsTaken,
  canPublish,
  canDelete,
}: {
  values: EventValues;
  offices: OfficeZone[];
  cover: PickedMedia | null;
  shareImage: PickedMedia | null;
  seatsTaken: number;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id));
  const [summary, setSummary] = useState(values.summary);
  const [body, setBody] = useState(values.descriptionHtml);
  const [officeId, setOfficeId] = useState(values.officeId);
  const [isOnline, setIsOnline] = useState(values.isOnline);
  const [embed, setEmbed] = useState(values.mapsEmbedUrl);
  const preview = mapsEmbedSrc(embed, [values.venueName, values.venueAddress].filter(Boolean).join(", "));
  const [capacity, setCapacity] = useState(values.capacity === null ? "" : String(values.capacity));
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

  const statuses = canPublish ? ["draft", "scheduled", "published", "archived"] : ["draft", "archived"];
  const zone = offices.find((office) => office.id === officeId)?.timezone;
  const clock = zone ? `Times are the clock on the wall in ${zone}.` : "Choose the office first. Until then times are read as UTC.";
  const seatsLeft = capacity ? Number(capacity) - seatsTaken : null;

  return (
    <form id="admin-event-form"
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const payload = {
          ...(values.id ? { id: values.id } : {}),
          title,
          slug,
          eventType: String(form.get("eventType") ?? "seminar"),
          officeId,
          summary,
          descriptionHtml: body,
          coverImageId: String(form.get("coverImageId") ?? ""),
          startsAt: String(form.get("startsAt") ?? ""),
          endsAt: String(form.get("endsAt") ?? ""),
          isOnline,
          // The hidden half of the pair is cleared rather than kept out of sight.
          onlineUrl: isOnline ? String(form.get("onlineUrl") ?? "") : "",
          venueName: isOnline ? "" : String(form.get("venueName") ?? ""),
          venueAddress: isOnline ? "" : String(form.get("venueAddress") ?? ""),
          mapsEmbedUrl: isOnline ? "" : embed,
          capacity: capacity ? Number(capacity) : null,
          registrationEnabled: form.get("registrationEnabled") === "on",
          registrationDeadline: String(form.get("registrationDeadline") ?? ""),
          status,
          publishedAt: String(form.get("publishedAt") ?? ""),
          seoTitle: seo.seoTitle,
          seoDescription: seo.seoDescription,
          seoOgImageId: seo.seoOgImageId ?? "",
          seoNoindex: seo.seoNoindex,
          canonicalUrl: seo.canonicalUrl,
        };

        const result = values.id ? await updateEvent(payload) : await createEvent(payload);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (!result.ok) return;
        if (values.id) router.refresh();
        else router.push(`/admin/events/${result.data.id}`);
      }}
    >
      <UnsavedGuard formId="admin-event-form" />
      <label className="admin-field">
        <span className="t-small">Title</span>
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <span className="t-small admin-help">The name on the events list and at the top of the event page.</span>
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
          The event lives at {company.url}/events/{slug || "..."}. Changing it on a published event
          leaves a redirect behind, so old links keep working.
        </span>
        {errors.slug ? <span className="t-small admin-error">{errors.slug[0]}</span> : null}
      </label>

      <label className="admin-field">
        <span className="t-small">Kind of event</span>
        <select name="eventType" defaultValue={values.eventType}>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {eventTypeLabels[type]}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">The label on the event card and the filter it sits under.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Office</span>
        <select value={officeId} onChange={(event) => setOfficeId(event.target.value)}>
          <option value="">Not set</option>
          {offices.map((office) => (
            <option key={office.id} value={office.id}>
              {office.name}
            </option>
          ))}
        </select>
        <span className="t-small admin-help">
          Whose event it is. Every time below is read and shown in that office&apos;s time zone, and the
          event only appears on the home page for visitors seeing that office.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Summary</span>
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
        <span className="t-small admin-help">The sentence under the title on the events list.</span>
        {errors.summary ? <span className="t-small admin-error">{errors.summary[0]}</span> : null}
      </label>

      <RichText
        label="Description"
        help="Everything on the event page under the cover picture."
        value={values.descriptionHtml}
        onChange={setBody}
      />

      <MediaPicker
        label="Cover image"
        name="coverImageId"
        value={cover}
        help="The wide picture at the top of the event page and on its card."
      />

      <h2 className="t-h5 admin-subhead">When</h2>

      <label className="admin-field">
        <span className="t-small">Starts</span>
        <input type="datetime-local" name="startsAt" defaultValue={values.startsAt} />
        <span className="t-small admin-help">{clock}</span>
        {errors.startsAt ? <span className="t-small admin-error">{errors.startsAt[0]}</span> : null}
      </label>

      <label className="admin-field">
        <span className="t-small">Ends</span>
        <input type="datetime-local" name="endsAt" defaultValue={values.endsAt} />
        <span className="t-small admin-help">Leave it empty if there is no finish time. {clock}</span>
        {errors.endsAt ? <span className="t-small admin-error">{errors.endsAt[0]}</span> : null}
      </label>

      <h2 className="t-h5 admin-subhead">Where</h2>

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" checked={isOnline} onChange={(event) => setIsOnline(event.target.checked)} /> This
          event is online
        </span>
        <span className="t-small admin-help">
          An online event shows the joining link instead of an address. A venue event shows the
          address and the map.
        </span>
      </label>

      {isOnline ? (
        <label className="admin-field">
          <span className="t-small">Joining link</span>
          <input name="onlineUrl" defaultValue={values.onlineUrl} />
          <span className="t-small admin-help">
            Where people join, starting with https://. It is shown on the page and sent in the
            confirmation email.
          </span>
          {errors.onlineUrl ? <span className="t-small admin-error">{errors.onlineUrl[0]}</span> : null}
        </label>
      ) : (
        <>
          <label className="admin-field">
            <span className="t-small">Venue</span>
            <input name="venueName" defaultValue={values.venueName} />
            <span className="t-small admin-help">The name shown in the Where block on the event page.</span>
            {errors.venueName ? <span className="t-small admin-error">{errors.venueName[0]}</span> : null}
          </label>

          <label className="admin-field">
            <span className="t-small">Address</span>
            <textarea name="venueAddress" defaultValue={values.venueAddress} rows={2} />
            <span className="t-small admin-help">The street address under the venue name.</span>
          </label>

          <label className="admin-field">
            <span className="t-small">Map to show on the page</span>
            <input name="mapsEmbedUrl" value={embed} onChange={(event) => setEmbed(event.target.value)} />
            <span className="t-small admin-help">
              Leave this empty and the map is built from the address above. To pin somewhere else,
              choose Share in Google Maps, then Embed a map, then copy the address inside src=&quot;...&quot;.
              The map below is what visitors will see.
            </span>
            {errors.mapsEmbedUrl ? <span className="t-small admin-error">{errors.mapsEmbedUrl[0]}</span> : null}
          </label>

          {preview ? (
            <iframe title="Map preview" src={preview} width="100%" height="260" loading="lazy" />
          ) : (
            <p className="t-small admin-empty">No map yet. Fill in the venue address above, or paste a map address here.</p>
          )}
        </>
      )}

      <h2 className="t-h5 admin-subhead">Registration</h2>

      <label className="admin-field">
        <span className="t-small">
          <input type="checkbox" name="registrationEnabled" defaultChecked={values.registrationEnabled} /> Take
          registrations
        </span>
        <span className="t-small admin-help">
          Off hides the form on the event page and turns away anything still posted to it.
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Seats</span>
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />
        <span className="t-small admin-help">
          {seatsTaken} registered so far. {seatsLeft === null
            ? "Leave it empty for no limit."
            : `${Math.max(0, seatsLeft)} of ${capacity} left. The form closes itself when they run out.`}
        </span>
        {errors.capacity ? <span className="t-small admin-error">{errors.capacity[0]}</span> : null}
      </label>

      <label className="admin-field">
        <span className="t-small">Registration closes</span>
        <input type="datetime-local" name="registrationDeadline" defaultValue={values.registrationDeadline} />
        <span className="t-small admin-help">
          Left empty, registration closes when the event starts. {clock}
        </span>
        {errors.registrationDeadline ? (
          <span className="t-small admin-error">{errors.registrationDeadline[0]}</span>
        ) : null}
      </label>

      {values.id ? (
        <p className="t-small admin-help">
          <Link href={`/admin/events/${values.id}/registrations`}>See who has registered</Link>
        </p>
      ) : null}

      <SeoFields
        value={seo}
        onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
        path={`/events/${slug || "..."}`}
        fallbackTitle={title}
        fallbackDescription={summary}
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
            : "You can save drafts. An admin puts the event live."}
        </span>
      </label>

      <label className="admin-field">
        <span className="t-small">Go live at</span>
        <input type="datetime-local" name="publishedAt" defaultValue={values.publishedAt} />
        <span className="t-small admin-help">
          When the event page appears on the site, in UTC. This is not the time of the event itself.
        </span>
        {errors.publishedAt ? <span className="t-small admin-error">{errors.publishedAt[0]}</span> : null}
      </label>

      <div className="admin-actions">
        <button type="submit" className="btn-black-sm" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>

        {values.id ? (
          <Link className="btn-black-sm" href={`/events/${values.slug}`} target="_blank">
            View on site
          </Link>
        ) : null}

        {values.id && canDelete ? (
          <button
            type="button"
            className="btn-black-sm"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Take this event off the site? It stays here as archived.")) return;
              setBusy(true);
              const result = await archiveEvent({ id: values.id });
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
