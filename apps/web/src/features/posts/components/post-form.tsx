"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { EXCERPT_MAX } from "@/config/content-meta";
import { slugify } from "@/lib/utils/slug";
import { archivePost, createPost, updatePost } from "@/features/posts/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import type { EditorialOptions } from "@/features/posts/admin-queries";
import { Button } from "@/components/ui/admin/button";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { AdvancedSection, EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { MultiSelectField, SelectField, TextAreaField, TextField } from "@/components/shared/admin/fields";
import { ErrorState } from "@/components/shared/admin/states";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";

// Tiptap is a large dependency and belongs only in the browser, so the Worker never bundles it.
const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

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
};

const publishableStatuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function PostForm({
  values,
  options,
  banner,
  canPublish,
  canDelete,
}: {
  values: PostValues;
  options: EditorialOptions;
  banner: PickedMedia | null;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState(values);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id));
  const [live, setLive] = useState(values.status === "published");
  const askToPublish = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = <K extends keyof PostValues>(key: K, value: PostValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const setTitle = (title: string) => {
    setForm((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) }));
    setDirty(true);
  };

  const goingLive = form.status === "published" && !live;
  // A slug problem is unreachable while the section is shut, so an error opens it.

  const persist = async () => {
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      bodyHtml: form.bodyHtml,
      bannerImageId: form.bannerImageId,
      categoryId: form.categoryId,
      officeId: form.officeId,
      destinationId: form.destinationId,
      tagIds: form.tagIds,
      authorDisplayName: form.authorDisplayName,
      status: form.status,
    };

    const id = values.id;
    const saved = await run(
      () => (id ? updatePost({ ...payload, id }) : createPost(payload)),
      goingLive
        ? { success: "Article published", failure: "Couldn't publish the article." }
        : id
          ? { success: "Article saved", failure: "Couldn't save the article." }
          : { success: "Article created", failure: "Couldn't create the article." },
    );
    if (!saved) return;

    setDirty(false);
    setLive(payload.status === "published");
    if (id) router.refresh();
    else router.push(`/admin/posts/${saved.id}`);
  };

  const archive = async () => {
    const id = values.id;
    if (!id) return;
    const done = await run(() => archivePost({ id }), {
      success: "Article archived",
      failure: "Couldn't archive the article.",
    });
    if (!done) return;
    setForm((current) => ({ ...current, status: "archived" }));
    setLive(false);
    router.refresh();
  };

  const statuses = canPublish
    ? publishableStatuses
    : publishableStatuses.filter((status) => status.value !== "published");

  const visibility = form.status === "published" ? "Visible on the website" : "Not visible on the website";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        // The dialog belongs to the save, not to the dropdown, so nobody is interrupted while
        // they are still deciding.
        if (goingLive) askToPublish.current?.click();
        else void persist();
      }}
    >
      <UnsavedGuard dirty={dirty} />

      <EditorLayout
        aside={
          <SectionCard title="Publishing">
            <SelectField
              name="status"
              label="Status"
              value={form.status}
              onChange={(value) => set("status", value)}
              options={statuses}
              error={errors.status?.[0]}
              help={canPublish ? visibility : `${visibility}. An admin can publish it.`}
            />

            {errors.publish?.length ? (
              <ErrorState title="This cannot go live yet" description={errors.publish.join(" ")} />
            ) : null}
          </SectionCard>
        }
      >
        <SectionCard title="Article">
          <TextField
            name="title"
            label="Title"
            value={form.title}
            required
            onChange={setTitle}
            error={errors.title?.[0]}
          />

          <TextAreaField
            name="excerpt"
            label="Summary"
            rows={3}
            value={form.excerpt}
            hint={`${form.excerpt.length} / ${EXCERPT_MAX}`}
            error={errors.excerpt?.[0]}
            onChange={(value) => set("excerpt", value)}
          />
        </SectionCard>

        <SectionCard title="Body">
          <RichText
            value={values.bodyHtml}
            onChange={(value) => set("bodyHtml", value)}
            minHeight="min-h-[32rem]"
          />
        </SectionCard>

        <SectionCard title="Media">
          <MediaPicker
            label="Image"
            name="bannerImageId"
            value={banner}
            onChange={(id) => set("bannerImageId", id ?? "")}
          />
        </SectionCard>

        <SectionCard title="Article details">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="categoryId"
              label="Category"
              value={form.categoryId}
              onChange={(value) => set("categoryId", value)}
              emptyLabel="Not set"
              error={errors.categoryId?.[0]}
              options={options.categories.map((category) => ({ value: category.id, label: category.name }))}
            />

            <SelectField
              name="officeId"
              label="Office"
              value={form.officeId}
              onChange={(value) => set("officeId", value)}
              emptyLabel="Both offices"
              error={errors.officeId?.[0]}
              options={options.offices.map((office) => ({ value: office.id, label: office.name }))}
            />

            <SelectField
              name="destinationId"
              label="Destination"
              value={form.destinationId}
              onChange={(value) => set("destinationId", value)}
              emptyLabel="Not about one country"
              error={errors.destinationId?.[0]}
              options={options.destinations.map((destination) => ({
                value: destination.id,
                label: destination.name,
              }))}
            />

            <TextField
              name="authorDisplayName"
              label="Author"
              value={form.authorDisplayName}
              help="Leave it empty for no by-line."
              error={errors.authorDisplayName?.[0]}
              onChange={(value) => set("authorDisplayName", value)}
            />
          </div>

          <MultiSelectField
            name="tagIds"
            label="Tags"
            selected={form.tagIds}
            onChange={(value) => set("tagIds", value)}
            placeholder="Choose tags"
            searchPlaceholder="Search tags"
            emptyMessage="No tags yet."
            error={errors.tagIds?.[0]}
            options={options.tags.map((tag) => ({ value: tag.id, label: tag.name }))}
          />
        </SectionCard>

        <AdvancedSection open={Boolean(errors.slug?.[0])}>
          <TextField
            name="slug"
            label="URL slug"
            value={form.slug}
            help="Used in the page address."
            error={errors.slug?.[0]}
            onChange={(value) => {
              setSlugTouched(true);
              set("slug", value);
            }}
          />
        </AdvancedSection>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={goingLive ? "Publish" : "Save"}
        savingLabel={goingLive ? "Publishing..." : "Saving..."}
        destructive={
          values.id && canDelete && form.status !== "archived" ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="ghost" size="sm" className="text-destructive">
                  Archive
                </Button>
              }
              title="Take this article off the website?"
              description="It stays here as an archived article and you can put it back."
              confirmLabel="Archive"
              onConfirm={archive}
            />
          ) : null
        }
      />

      {/* The confirmation is opened by the save, so its trigger stays out of the layout. */}
      <ConfirmDialog
        trigger={<button ref={askToPublish} type="button" hidden tabIndex={-1} aria-hidden />}
        title="Publish this article?"
        description="It will become visible on the public website."
        confirmLabel="Publish"
        destructive={false}
        onConfirm={persist}
      />
    </form>
  );
}
