"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/components/admin/media-picker";
import { Field, Repeater, SaveBar, Select, TextArea, Toggle } from "@/components/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/admin/page-seo-fields";
import { createDestination, deleteDestination, updateDestination } from "@/server/actions/destinations";
import { destinationPath } from "@/lib/validators/destination";

type Highlight = { label: string; value: string; note: string };
type Line = { text: string };
type Intake = { month: string; note: string };
type Migration = { title: string; body: string; icon: string };
type Cost = { label: string; amount: number; currency: string; note: string };
type Help = { title: string; body: string };

export type DestinationValue = SeoValue & {
  id?: string;
  slug: string;
  name: string;
  countryCode: string;
  tagline: string;
  heroImageId: string | null;
  flagImageId: string | null;
  cardImageId: string | null;
  factPill: string;
  overviewHtml: string;
  academicHtml: string;
  workHtml: string;
  isFeatured: boolean;
  hasPage: boolean;
  status: string;
  sortOrder: number;
  migrationTitle: string;
  whyTitle: string;
  checklistTitle: string;
  highlights: Highlight[];
  why: Line[];
  checklist: Line[];
  intakes: Intake[];
  migration: Migration[];
  costs: Cost[];
  help: Help[];
};

const TABS = [
  ["highlights", "Highlights"],
  ["why", "Why study there"],
  ["checklist", "Checklist"],
  ["intakes", "Intakes"],
  ["migration", "Migration"],
  ["costs", "Costs"],
  ["help", "How we help"],
] as const;

export function DestinationEditor({
  value,
  media,
  canDelete,
  canPublish,
}: {
  value: DestinationValue;
  media: Record<string, PickedMedia>;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [row, setRow] = useState<DestinationValue>(value);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("highlights");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<DestinationValue>) => setRow((current) => ({ ...current, ...patch }));
  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const path = destinationPath(row.slug);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateDestination(row) : await createDestination(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/destinations/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field
        label="Name"
        help="The country name on the card and at the top of the page."
        value={row.name}
        onChange={(name) => set({ name })}
        error={errors.name?.[0]}
      />

      <Field
        label="Web address"
        help={`This destination will live at ${path}. Changing it leaves a redirect behind so old links still work.`}
        value={row.slug}
        onChange={(slug) => set({ slug })}
        error={errors.slug?.[0]}
      />

      <Field
        label="Country code"
        help="Two letters, like AU. Used for the flag and for filters."
        value={row.countryCode}
        onChange={(countryCode) => set({ countryCode })}
        error={errors.countryCode?.[0]}
      />

      <Field
        label="Tagline"
        help="The short line under the country name."
        value={row.tagline}
        onChange={(tagline) => set({ tagline })}
      />

      <Field
        label="Card fact"
        help="The small pill on the homepage card, like 1,100+ institutions."
        value={row.factPill}
        onChange={(factPill) => set({ factPill })}
      />

      <MediaPicker
        label="Card image"
        name="cardImageId"
        value={pick(row.cardImageId)}
        help="The picture on the destination card on the homepage and the study abroad page."
        onChange={(cardImageId) => set({ cardImageId })}
      />
      <MediaPicker
        label="Flag"
        name="flagImageId"
        value={pick(row.flagImageId)}
        help="The small flag beside the country name."
        onChange={(flagImageId) => set({ flagImageId })}
      />
      <MediaPicker
        label="Hero image"
        name="heroImageId"
        value={pick(row.heroImageId)}
        help="The wide picture at the top of the destination page."
        onChange={(heroImageId) => set({ heroImageId })}
      />

      <TextArea
        label="Overview"
        help="The opening section of the destination page."
        rows={6}
        value={row.overviewHtml}
        onChange={(overviewHtml) => set({ overviewHtml })}
      />
      <TextArea
        label="Academic section"
        help="The block about study and qualifications."
        rows={5}
        value={row.academicHtml}
        onChange={(academicHtml) => set({ academicHtml })}
      />
      <TextArea
        label="Work section"
        help="The block about working while studying."
        rows={5}
        value={row.workHtml}
        onChange={(workHtml) => set({ workHtml })}
      />

      <h2 className="t-h5 admin-subhead">Blocks</h2>
      <div className="admin-filters">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="btn-black-sm"
            aria-current={tab === key ? "true" : undefined}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "highlights" ? (
        <Repeater<Highlight>
          label="Highlights"
          help="The number cards near the top of the destination page."
          items={row.highlights}
          blank={() => ({ label: "", value: "", note: "" })}
          onChange={(highlights) => set({ highlights })}
          addLabel="Add a highlight"
        >
          {(item, update) => (
            <>
              <Field label="Label" value={item.label} onChange={(label) => update({ label })} />
              <Field label="Value" value={item.value} onChange={(v) => update({ value: v })} />
              <Field label="Note" value={item.note} onChange={(note) => update({ note })} />
            </>
          )}
        </Repeater>
      ) : null}

      {tab === "why" ? (
        <>
          <Field
            label="Section heading"
            help="The heading above the reasons list, like Why study in Australia."
            value={row.whyTitle}
            onChange={(whyTitle) => set({ whyTitle })}
          />
          <Repeater<Line>
            label="Reasons"
            help="One line per reason, in this order."
            items={row.why}
            blank={() => ({ text: "" })}
            onChange={(why) => set({ why })}
            addLabel="Add a reason"
          >
            {(item, update) => <Field label="Reason" value={item.text} onChange={(t) => update({ text: t })} />}
          </Repeater>
        </>
      ) : null}

      {tab === "checklist" ? (
        <>
          <Field
            label="Section heading"
            help="The heading above the checklist."
            value={row.checklistTitle}
            onChange={(checklistTitle) => set({ checklistTitle })}
          />
          <Repeater<Line>
            label="Checklist"
            help="What an applicant needs, in the order they need it."
            items={row.checklist}
            blank={() => ({ text: "" })}
            onChange={(checklist) => set({ checklist })}
            addLabel="Add a step"
          >
            {(item, update) => <Field label="Step" value={item.text} onChange={(t) => update({ text: t })} />}
          </Repeater>
        </>
      ) : null}

      {tab === "intakes" ? (
        <Repeater<Intake>
          label="Intakes"
          help="The months institutions in this country take new students."
          items={row.intakes}
          blank={() => ({ month: "", note: "" })}
          onChange={(intakes) => set({ intakes })}
          addLabel="Add an intake"
        >
          {(item, update) => (
            <>
              <Field label="Month" value={item.month} onChange={(month) => update({ month })} />
              <Field label="Note" value={item.note} onChange={(note) => update({ note })} />
            </>
          )}
        </Repeater>
      ) : null}

      {tab === "migration" ? (
        <>
          <Field
            label="Section heading"
            help="The heading above the migration blocks."
            value={row.migrationTitle}
            onChange={(migrationTitle) => set({ migrationTitle })}
          />
          <Repeater<Migration>
            label="Migration blocks"
            help="Visa and stay-back information, one block each."
            items={row.migration}
            blank={() => ({ title: "", body: "", icon: "" })}
            onChange={(migration) => set({ migration })}
            addLabel="Add a block"
          >
            {(item, update) => (
              <>
                <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
                <TextArea label="Words" rows={3} value={item.body} onChange={(body) => update({ body })} />
              </>
            )}
          </Repeater>
        </>
      ) : null}

      {tab === "costs" ? (
        <Repeater<Cost>
          label="Costs"
          help="What a student should budget for, shown as a list on the page."
          items={row.costs}
          blank={() => ({ label: "", amount: 0, currency: "AUD", note: "" })}
          onChange={(costs) => set({ costs })}
          addLabel="Add a cost"
        >
          {(item, update) => (
            <>
              <Field label="What it is for" value={item.label} onChange={(label) => update({ label })} />
              <Field
                label="Amount"
                type="number"
                value={String(item.amount)}
                onChange={(amount) => update({ amount: Number(amount) || 0 })}
              />
              <Field label="Currency" value={item.currency} onChange={(currency) => update({ currency })} />
              <Field label="Note" value={item.note} onChange={(note) => update({ note })} />
            </>
          )}
        </Repeater>
      ) : null}

      {tab === "help" ? (
        <Repeater<Help>
          label="How we help"
          help="What Goodluck does for a student going to this country."
          items={row.help}
          blank={() => ({ title: "", body: "" })}
          onChange={(help) => set({ help })}
          addLabel="Add a block"
        >
          {(item, update) => (
            <>
              <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
              <TextArea label="Words" rows={3} value={item.body} onChange={(body) => update({ body })} />
            </>
          )}
        </Repeater>
      ) : null}

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <Toggle
        label="Has a page of its own"
        help="Unticked, the card still shows on the homepage but sends people to the booking form instead."
        checked={row.hasPage}
        onChange={(hasPage) => set({ hasPage })}
      />
      <Toggle
        label="Featured"
        help="Ticked, the card is shown on the homepage."
        checked={row.isFeatured}
        onChange={(isFeatured) => set({ isFeatured })}
      />
      <Field
        label="Order"
        type="number"
        help="Lower numbers come first on the study abroad page."
        value={String(row.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />
      <Select
        label="Status"
        help="Only published destinations are on the site."
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
        fallbackDescription={row.tagline}
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
                const result = await deleteDestination({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/destinations");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
