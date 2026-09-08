"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker";
import { Field, Repeater, SaveBar, Select, TextArea, Toggle } from "@/components/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/admin/page-seo-fields";
import { createService, deleteService, updateService } from "@/server/actions/services";
import { servicePath, tones } from "@/lib/content-meta";

type Step = { title: string; body: string };
type Fact = { label: string; value: string };
type Doc = { label: string };

export type ServiceValue = SeoValue & {
  id?: string;
  slug: string;
  name: string;
  category: string;
  officeScope: string;
  summary: string;
  introHtml: string;
  steps: Step[];
  facts: Fact[];
  documents: Doc[];
  artworkId: string | null;
  reelId: string | null;
  posterImageId: string | null;
  tone: string;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
  label: string;
  stepsTitle: string;
  listTitle: string;
};

const TONE_LABEL: Record<string, string> = {
  blue: "Blue",
  dark: "Dark",
  surface: "Light grey",
  white: "White",
};

export function ServiceEditor({
  value,
  media,
  canDelete,
  canPublish,
}: {
  value: ServiceValue;
  media: Record<string, PickedMedia>;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [row, setRow] = useState<ServiceValue>(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<ServiceValue>) => setRow((current) => ({ ...current, ...patch }));
  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const path = servicePath(row.slug);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateService(row) : await createService(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/services/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field
        label="Name"
        help="The service name on the homepage card and at the top of its page."
        value={row.name}
        onChange={(name) => set({ name })}
        error={errors.name?.[0]}
      />

      <Field
        label="Web address"
        help={`This service will live at ${path}. Changing it leaves a redirect behind so old links still work.`}
        value={row.slug}
        onChange={(slug) => set({ slug })}
        error={errors.slug?.[0]}
      />

      <Field
        label="Card badge"
        help="The small word on the homepage card, like Study, Visa or Funding."
        value={row.label}
        onChange={(label) => set({ label })}
      />

      <Field
        label="Summary"
        help="The one line under the name, on the card and in lists."
        value={row.summary}
        onChange={(summary) => set({ summary })}
      />

      <TextArea
        label="Introduction"
        help="The opening section of the service page."
        rows={6}
        value={row.introHtml}
        onChange={(introHtml) => set({ introHtml })}
      />

      <Select
        label="Category"
        help="Groups the service on the services page and in enquiry forms."
        value={row.category}
        onChange={(category) => set({ category })}
        options={[
          { value: "education", label: "Education" },
          { value: "study_abroad", label: "Study abroad" },
          { value: "test_prep", label: "Test preparation" },
          { value: "migration", label: "Migration" },
        ]}
      />

      <Select
        label="Office"
        help="Both shows it everywhere. One office shows it only for that office."
        value={row.officeScope}
        onChange={(officeScope) => set({ officeScope })}
        options={[
          { value: "both", label: "Both offices" },
          { value: "au", label: "Australia only" },
          { value: "np", label: "Nepal only" },
        ]}
      />

      <Select
        label="Card colour"
        help="The colour of this service's tile in the homepage grid."
        value={row.tone}
        onChange={(tone) => set({ tone })}
        options={tones.map((tone) => ({ value: tone, label: TONE_LABEL[tone] }))}
        error={errors.tone?.[0]}
      />

      <MediaPicker
        label="Card artwork"
        name="artworkId"
        value={pick(row.artworkId)}
        help="The picture on the homepage tile and at the top of the service page."
        onChange={(artworkId) => set({ artworkId })}
      />
      <MediaPicker
        label="Reel"
        name="reelId"
        value={pick(row.reelId)}
        help="The short video that plays on the service page. Leave empty for no video."
        onChange={(reelId) => set({ reelId })}
      />
      <MediaPicker
        label="Reel poster"
        name="posterImageId"
        value={pick(row.posterImageId)}
        help="The still frame shown before the reel plays."
        onChange={(posterImageId) => set({ posterImageId })}
      />

      <Field
        label="Steps heading"
        help="The heading above the steps, like How counselling works."
        value={row.stepsTitle}
        onChange={(stepsTitle) => set({ stepsTitle })}
      />

      <Repeater<Step>
        label="Steps"
        help="What happens, in order, on the service page."
        items={row.steps}
        blank={() => ({ title: "", body: "" })}
        onChange={(steps) => set({ steps })}
        addLabel="Add a step"
      >
        {(item, update) => (
          <>
            <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
            <TextArea label="Words" rows={3} value={item.body} onChange={(body) => update({ body })} />
          </>
        )}
      </Repeater>

      <Repeater<Fact>
        label="Facts"
        help="The number cards on the service page."
        items={row.facts}
        blank={() => ({ label: "", value: "" })}
        onChange={(facts) => set({ facts })}
        addLabel="Add a fact"
      >
        {(item, update) => (
          <>
            <Field label="Number" value={item.value} onChange={(v) => update({ value: v })} />
            <Field label="What it counts" value={item.label} onChange={(label) => update({ label })} />
          </>
        )}
      </Repeater>

      <Field
        label="Documents heading"
        help="The heading above the documents list."
        value={row.listTitle}
        onChange={(listTitle) => set({ listTitle })}
      />

      <Repeater<Doc>
        label="Documents"
        help="What a student needs to bring, listed on the service page."
        items={row.documents}
        blank={() => ({ label: "" })}
        onChange={(documents) => set({ documents })}
        addLabel="Add a document"
      >
        {(item, update) => <Field label="Document" value={item.label} onChange={(label) => update({ label })} />}
      </Repeater>

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <Toggle
        label="Featured"
        help="Ticked, the service is shown in the homepage grid."
        checked={row.isFeatured}
        onChange={(isFeatured) => set({ isFeatured })}
      />
      <Field
        label="Order"
        type="number"
        help="Lower numbers come first on the services page and in the homepage grid."
        value={String(row.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />
      <Select
        label="Status"
        help="Only published services are on the site."
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
        fallbackDescription={row.summary}
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
                const result = await deleteService({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/services");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
