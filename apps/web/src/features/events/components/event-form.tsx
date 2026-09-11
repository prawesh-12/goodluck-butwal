"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Users } from "lucide-react";
import { slugify } from "@/lib/utils/slug";
import { eventTypeLabels, eventTypes, type EventType } from "@/config/content-meta";
import { archiveEvent, createEvent, updateEvent } from "@/features/events/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import type { OfficeZone } from "@/features/events/admin-queries";
import {
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from "@/components/shared/admin/fields";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { PreviewButton, ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { Button } from "@/components/ui/admin/button";

const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

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
};

// Capacity is typed, so it lives in the form as text and turns back into a number on save.
type FormState = Omit<EventValues, "capacity"> & { capacity: string };

export function EventForm({
  values,
  offices,
  cover,
  seatsTaken,
  canPublish,
  canDelete,
}: {
  values: EventValues;
  offices: OfficeZone[];
  cover: PickedMedia | null;
  seatsTaken: number;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState<FormState>({
    ...values,
    capacity: values.capacity === null ? "" : String(values.capacity),
  });
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id));
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const id = values.id;
  const zone = offices.find((office) => office.id === form.officeId)?.timezone;
  const clock = zone
    ? `Times are the clock on the wall in ${zone}.`
    : "Choose the office first. Until then times are read as UTC.";
  const seatsLeft = form.capacity ? Math.max(0, Number(form.capacity) - seatsTaken) : null;
  const goingLive = form.status === "published" && values.status !== "published";

  const save = async () => {
    const payload = {
      ...(id ? { id } : {}),
      title: form.title,
      slug: form.slug,
      eventType: form.eventType,
      officeId: form.officeId,
      summary: form.summary,
      descriptionHtml: form.descriptionHtml,
      coverImageId: form.coverImageId,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      isOnline: form.isOnline,
      // The hidden half of the pair is cleared rather than kept out of sight.
      onlineUrl: form.isOnline ? form.onlineUrl : "",
      venueName: form.isOnline ? "" : form.venueName,
      venueAddress: form.isOnline ? "" : form.venueAddress,
      mapsEmbedUrl: form.isOnline ? "" : form.mapsEmbedUrl,
      capacity: form.capacity ? Number(form.capacity) : null,
      registrationEnabled: form.registrationEnabled,
      registrationDeadline: form.registrationDeadline,
      status: form.status,
    };

    const saved = await run(() => (id ? updateEvent(payload) : createEvent(payload)), {
      success: id ? "Event saved" : "Event created",
      failure: id ? "Couldn't save the event." : "Couldn't create the event.",
    });
    if (!saved) return;
    setDirty(false);
    if (id) router.refresh();
    else router.push(`/admin/events/${saved.id}`);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (goingLive) {
      setConfirmingPublish(true);
      return;
    }
    void save();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <UnsavedGuard dirty={dirty} />

      <EditorLayout
        aside={
          <SectionCard title="Publishing">
            <SelectField
              name="status"
              label="Status"
              value={form.status}
              onChange={(status) => set({ status })}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published", disabled: !canPublish },
                { value: "archived", label: "Archived" },
              ]}
              help={canPublish ? undefined : "You can save drafts. An admin puts the event live."}
            />

            {id && values.slug ? (
              values.status === "published" ? (
                <ViewOnSiteButton href={`/events/${values.slug}`} />
              ) : (
                <PreviewButton href={`/preview/event/${values.slug}`} />
              )
            ) : null}
          </SectionCard>
        }
      >
        <SectionCard title="Event information" description={clock}>
          <TextField
            name="title"
            label="Title"
            value={form.title}
            required
            error={errors.title?.[0]}
            onChange={(title) => set(slugTouched ? { title } : { title, slug: slugify(title) })}
          />

          <TextField
            name="slug"
            label="URL slug"
            help="Used in the page address."
            value={form.slug}
            error={errors.slug?.[0]}
            onChange={(slug) => {
              setSlugTouched(true);
              set({ slug });
            }}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="eventType"
              label="Kind of event"
              value={form.eventType}
              onChange={(eventType) => set({ eventType: eventType as EventType })}
              options={eventTypes.map((type) => ({ value: type, label: eventTypeLabels[type] }))}
            />

            <SelectField
              name="officeId"
              label="Office"
              value={form.officeId}
              emptyLabel="Not set"
              onChange={(officeId) => set({ officeId })}
              options={offices.map((office) => ({ value: office.id, label: office.name }))}
            />
          </div>

          <TextAreaField
            name="summary"
            label="Summary"
            rows={3}
            value={form.summary}
            error={errors.summary?.[0]}
            onChange={(summary) => set({ summary })}
          />

          <RichText
            label="Description"
            value={values.descriptionHtml}
            onChange={(descriptionHtml) => set({ descriptionHtml })}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="startsAt"
              label="Starts"
              type="datetime-local"
              required
              value={form.startsAt}
              error={errors.startsAt?.[0]}
              onChange={(startsAt) => set({ startsAt })}
            />
            <TextField
              name="endsAt"
              label="Ends"
              type="datetime-local"
              help="Leave it empty if there is no finish time."
              value={form.endsAt}
              error={errors.endsAt?.[0]}
              onChange={(endsAt) => set({ endsAt })}
            />
          </div>
        </SectionCard>

        <SectionCard title="Attendance">
          <SwitchField
            label="Online event"
            checked={form.isOnline}
            onChange={(isOnline) => set({ isOnline })}
          />

          {form.isOnline ? (
            <TextField
              name="onlineUrl"
              label="Joining link"
              required
              help="Shown on the page and sent in the confirmation email."
              value={form.onlineUrl}
              error={errors.onlineUrl?.[0]}
              onChange={(onlineUrl) => set({ onlineUrl })}
            />
          ) : (
            <>
              <TextField
                name="venueName"
                label="Venue"
                required
                value={form.venueName}
                error={errors.venueName?.[0]}
                onChange={(venueName) => set({ venueName })}
              />

              <TextAreaField
                name="venueAddress"
                label="Address"
                rows={2}
                value={form.venueAddress}
                error={errors.venueAddress?.[0]}
                onChange={(venueAddress) => set({ venueAddress })}
              />

              <TextField
                name="mapsEmbedUrl"
                label="Map"
                help="In Google Maps choose Share, then Embed a map, and copy the address it gives you."
                value={form.mapsEmbedUrl}
                error={errors.mapsEmbedUrl?.[0]}
                onChange={(mapsEmbedUrl) => set({ mapsEmbedUrl })}
              />

              {form.mapsEmbedUrl.startsWith("https://") ? (
                <iframe
                  title="Map preview"
                  src={form.mapsEmbedUrl}
                  loading="lazy"
                  className="h-64 w-full rounded-lg border border-border"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No map yet. Paste an address above to see it here.
                </p>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard title="Media">
          <MediaPicker
            label="Event image"
            name="coverImageId"
            value={cover}
            onChange={(coverImageId) => set({ coverImageId: coverImageId ?? "" })}
          />
        </SectionCard>

        <SectionCard title="Registration">
          <SwitchField
            label="Accept registrations"
            checked={form.registrationEnabled}
            onChange={(registrationEnabled) => set({ registrationEnabled })}
          />

          {form.registrationEnabled ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  name="capacity"
                  label="Seats"
                  type="number"
                  value={form.capacity}
                  error={errors.capacity?.[0]}
                  onChange={(capacity) => set({ capacity })}
                  help={
                    seatsLeft === null
                      ? `${seatsTaken} registered so far. Leave it empty for no limit.`
                      : `${seatsTaken} registered so far, ${seatsLeft} of ${form.capacity} left.`
                  }
                />

                <TextField
                  name="registrationDeadline"
                  label="Registration closes"
                  type="datetime-local"
                  help="Left empty, registration closes when the event starts."
                  value={form.registrationDeadline}
                  error={errors.registrationDeadline?.[0]}
                  onChange={(registrationDeadline) => set({ registrationDeadline })}
                />
              </div>

              {id ? (
                <Button variant="outline" size="sm" render={<Link href={`/admin/events/${id}/registrations`} />}>
                    <Users />
                    View registrations
                  </Button>
              ) : null}
            </>
          ) : null}
        </SectionCard>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={goingLive ? "Publish" : "Save"}
        destructive={
          canDelete && id ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Archive />
                  Archive
                </Button>
              }
              title="Take this event off the site?"
              description="It comes off the public website and stays here as archived."
              confirmLabel="Archive event"
              onConfirm={async () => {
                const archived = await run(() => archiveEvent({ id }), {
                  success: "Event archived",
                  failure: "Couldn't archive the event.",
                });
                if (archived) {
                  setForm((current) => ({ ...current, status: "archived" }));
                  router.refresh();
                }
              }}
            />
          ) : null
        }
      />

      <ConfirmDialog
        open={confirmingPublish}
        onOpenChange={setConfirmingPublish}
        title="Publish this event?"
        description="It will become visible on the public website and start taking registrations."
        confirmLabel="Publish"
        destructive={false}
        onConfirm={save}
      />
    </form>
  );
}
