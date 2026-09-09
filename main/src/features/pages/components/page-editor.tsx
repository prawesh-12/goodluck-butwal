"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field, Repeater, SaveBar, Select, TextArea, Toggle } from "@/components/shared/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/shared/admin/page-seo-fields";
import { createPage, deletePage, updatePage } from "@/features/pages/actions";
import { pagePath } from "@/config/content-meta";

type Blocks = Record<string, unknown>;

export type PageValue = SeoValue & {
  id?: string;
  slug: string;
  parent: string;
  title: string;
  intro: string;
  bodyHtml: string;
  heroImageId: string | null;
  showInNav: boolean;
  status: string;
  sortOrder: number;
  blocks: Blocks;
};

type TitleBody = { title: string; body: string };
type Line = { text: string };
type Partner = { name: string; photo_id: string | null; logo_id: string | null; line: string };
type Voice = { quote: string; name: string; role: string; photo_id: string | null };

const rows = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const text = (value: unknown) => (typeof value === "string" ? value : "");

// The ethics list is stored as plain strings, but a repeater row has to be an object.
function toForm(slug: string, blocks: Blocks): Blocks {
  if (slug !== "about") return blocks;
  return { ...blocks, ethics: rows<string>(blocks.ethics).map((line) => ({ text: line })) };
}

function toSave(slug: string, blocks: Blocks): Blocks {
  if (slug !== "about") return blocks;
  return { ...blocks, ethics: rows<Line>(blocks.ethics).map((line) => line.text) };
}

export function PageEditor({
  value,
  media,
  canDelete,
  canPublish,
}: {
  value: PageValue;
  media: Record<string, PickedMedia>;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState<PageValue>({ ...value, blocks: toForm(value.slug, value.blocks) });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<PageValue>) => setPage((current) => ({ ...current, ...patch }));
  const setBlocks = (patch: Blocks) => setPage((current) => ({ ...current, blocks: { ...current.blocks, ...patch } }));
  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const blocks = page.blocks;
  const path = pagePath(page.parent, page.slug);

  const submit = async () => {
    const payload = { ...page, blocks: toSave(page.slug, page.blocks) };
    return page.id ? updatePage(payload) : createPage(payload);
  };

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await submit();
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !page.id) router.push(`/admin/pages/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field
        label="Title"
        help="The heading at the top of the page, and the name in the menu."
        value={page.title}
        onChange={(title) => set({ title })}
        error={errors.title?.[0]}
      />

      <Select
        label="Section"
        help="About puts it under /about. Legal puts it under /legal with the privacy policy."
        value={page.parent}
        onChange={(parent) => set({ parent })}
        options={[
          { value: "about", label: "About" },
          { value: "legal", label: "Legal" },
        ]}
        error={errors.parent?.[0]}
      />

      <Field
        label="Web address"
        help={`This page will live at ${path}. Changing it leaves a redirect behind so old links still work.`}
        value={page.slug}
        onChange={(slug) => set({ slug })}
        error={errors.slug?.[0]}
      />

      <TextArea
        label="Intro"
        help="The paragraph under the heading, before the rest of the page."
        value={page.intro}
        onChange={(intro) => set({ intro })}
        error={errors.intro?.[0]}
      />

      <MediaPicker
        label="Hero image"
        name="heroImageId"
        value={pick(page.heroImageId)}
        help="The wide picture at the top of the page."
        onChange={(heroImageId) => set({ heroImageId })}
      />

      {page.slug === "about" ? (
        <>
          <h2 className="t-h5 admin-subhead">About blocks</h2>
          <Field
            label="Established line"
            help="The founding sentence in the opening block."
            value={text(blocks.established)}
            onChange={(established) => setBlocks({ established })}
          />
          <TextArea
            label="Mission"
            help="The mission paragraph on the About page."
            value={text(blocks.mission)}
            onChange={(mission) => setBlocks({ mission })}
          />
          <TextArea
            label="Vision"
            help="The vision paragraph next to the mission."
            value={text(blocks.vision)}
            onChange={(vision) => setBlocks({ vision })}
          />

          <Repeater<TitleBody>
            label="Values"
            help="The value cards below the mission and vision."
            items={rows<TitleBody>(blocks.values)}
            blank={() => ({ title: "", body: "" })}
            onChange={(values) => setBlocks({ values })}
            addLabel="Add a value"
          >
            {(item, update) => (
              <>
                <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
                <TextArea label="Words" rows={3} value={item.body} onChange={(body) => update({ body })} />
              </>
            )}
          </Repeater>

          <Repeater<Line>
            label="Ethics"
            help="The bullet list in the ethics block, in this order."
            items={rows<Line>(blocks.ethics)}
            blank={() => ({ text: "" })}
            onChange={(ethics) => setBlocks({ ethics })}
            addLabel="Add a bullet"
          >
            {(item, update) => <Field label="Bullet" value={item.text} onChange={(t) => update({ text: t })} />}
          </Repeater>

          <Field
            label="Founder quote"
            help="The pull quote near the bottom of the About page."
            value={text((blocks.quote as { text?: string } | undefined)?.text)}
            onChange={(t) =>
              setBlocks({ quote: { ...(blocks.quote as object), text: t, author: text((blocks.quote as { author?: string } | undefined)?.author) } })
            }
          />
          <Field
            label="Quote author"
            help="The name printed under the quote."
            value={text((blocks.quote as { author?: string } | undefined)?.author)}
            onChange={(author) =>
              setBlocks({ quote: { ...(blocks.quote as object), text: text((blocks.quote as { text?: string } | undefined)?.text), author } })
            }
          />
        </>
      ) : null}

      {page.slug === "message-from-co-founders" ? (
        <>
          <h2 className="t-h5 admin-subhead">Message</h2>
          <TextArea
            label="Summary"
            help="The short line above the message."
            value={text(blocks.summary)}
            onChange={(summary) => setBlocks({ summary })}
          />
          <TextArea
            label="Message"
            help="The full message. One paragraph per <p> tag. Anything the site cannot style is stripped on save."
            rows={12}
            value={text(blocks.message_html)}
            onChange={(message_html) => setBlocks({ message_html })}
          />
          <MediaPicker
            label="Co-founders photo"
            name="blocks.photo_id"
            value={pick(text(blocks.photo_id) || null)}
            help="The photograph beside the message."
            onChange={(photo_id) => setBlocks({ photo_id })}
          />
        </>
      ) : null}

      {page.slug === "corporate-social-responsibility" ? (
        <Repeater<Partner>
          label="Partners"
          help="The organisations listed on the responsibility page, in this order."
          items={rows<Partner>(blocks.partners)}
          blank={() => ({ name: "", photo_id: null, logo_id: null, line: "" })}
          onChange={(partners) => setBlocks({ partners })}
          addLabel="Add a partner"
        >
          {(item, update, index) => (
            <>
              <Field label="Name" value={item.name} onChange={(name) => update({ name })} />
              <TextArea label="Line" rows={2} value={item.line} onChange={(line) => update({ line })} />
              <MediaPicker
                label="Logo"
                name={`partner-${index}-logo`}
                value={pick(item.logo_id)}
                help="Shown in the partner row."
                onChange={(logo_id) => update({ logo_id })}
              />
              <MediaPicker
                label="Photo"
                name={`partner-${index}-photo`}
                value={pick(item.photo_id)}
                help="Optional picture beside the logo."
                onChange={(photo_id) => update({ photo_id })}
              />
            </>
          )}
        </Repeater>
      ) : null}

      {page.slug === "careers" ? (
        <>
          <Repeater<TitleBody>
            label="What it is like to work here"
            help="The value cards on the careers page."
            items={rows<TitleBody>(blocks.values)}
            blank={() => ({ title: "", body: "" })}
            onChange={(values) => setBlocks({ values })}
            addLabel="Add a value"
          >
            {(item, update) => (
              <>
                <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
                <TextArea label="Words" rows={3} value={item.body} onChange={(body) => update({ body })} />
              </>
            )}
          </Repeater>

          <Repeater<Voice>
            label="Staff voices"
            help="The quotes from staff further down the careers page."
            items={rows<Voice>(blocks.voices)}
            blank={() => ({ quote: "", name: "", role: "", photo_id: null })}
            onChange={(voices) => setBlocks({ voices })}
            addLabel="Add a voice"
          >
            {(item, update, index) => (
              <>
                <TextArea label="Quote" rows={3} value={item.quote} onChange={(quote) => update({ quote })} />
                <Field label="Name" value={item.name} onChange={(name) => update({ name })} />
                <Field label="Role" value={item.role} onChange={(role) => update({ role })} />
                <MediaPicker
                  label="Photo"
                  name={`voice-${index}-photo`}
                  value={pick(item.photo_id)}
                  help="Optional headshot next to the quote."
                  onChange={(photo_id) => update({ photo_id })}
                />
              </>
            )}
          </Repeater>

          <Field
            label="Applications email"
            help="Where the apply button on the careers page sends people."
            value={text(blocks.apply_email)}
            onChange={(apply_email) => setBlocks({ apply_email })}
          />
        </>
      ) : null}

      <TextArea
        label="Body"
        help="The main text of the page. Legal pages are body only. Anything the site cannot style is stripped on save."
        rows={10}
        value={page.bodyHtml}
        onChange={(bodyHtml) => set({ bodyHtml })}
      />

      <Toggle
        label="Show in the About menu"
        help="Ticked, the page appears in the About dropdown in the header."
        checked={page.showInNav}
        onChange={(showInNav) => set({ showInNav })}
      />

      <Field
        label="Order"
        type="number"
        help="Lower numbers come first in the menu and in lists."
        value={String(page.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />

      <Select
        label="Status"
        help="Only published pages are on the site. Scheduled ones go live on their own."
        value={page.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "draft", label: "Draft" },
          { value: "scheduled", label: "Scheduled", disabled: !canPublish },
          { value: "published", label: "Published", disabled: !canPublish },
          { value: "archived", label: "Archived" },
        ]}
      />

      <SeoFields
        value={page}
        onChange={set}
        path={path}
        fallbackTitle={page.title}
        fallbackDescription={page.intro}
        ogImage={pick(page.seoOgImageId)}
        errors={errors}
      />

      <SaveBar
        busy={busy}
        message={message}
        problems={errors.publish}
        viewHref={path}
        onDelete={
          canDelete && page.id
            ? async () => {
                if (!confirm(`Delete ${page.title}? This cannot be undone.`)) return;
                setBusy(true);
                const result = await deletePage({ id: page.id });
                setBusy(false);
                if (result.ok) router.push("/admin/pages");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
