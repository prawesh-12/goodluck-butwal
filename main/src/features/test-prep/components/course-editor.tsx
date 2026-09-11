"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { slugify } from "@/lib/utils/slug";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Repeater } from "@/components/shared/admin/repeater";
import { SelectField, TextAreaField, TextField } from "@/components/shared/admin/fields";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { ErrorState } from "@/components/shared/admin/states";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { PreviewButton, ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { Button } from "@/components/ui/admin/button";
import {
  createTestPrepCourse,
  deleteTestPrepCourse,
  updateTestPrepCourse,
} from "@/features/test-prep/actions";

const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

type SyllabusItem = { title: string; body: string };

export type CourseValue = {
  id?: string;
  slug: string;
  testType: string;
  name: string;
  summary: string;
  descriptionHtml: string;
  syllabus: SyllabusItem[];
  heroImageId: string | null;
  defaultFee: string;
  feeCurrency: string;
  status: string;
  sortOrder: number;
};

export function TestPrepCourseEditor({
  value,
  media,
  canDelete,
  canPublish,
}: {
  value: CourseValue;
  media: Record<string, PickedMedia>;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [row, setRow] = useState<CourseValue>(value);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(value.id));
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = (patch: Partial<CourseValue>) => {
    setRow((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const id = row.id;
  const goingLive = row.status === "published" && value.status !== "published";

  const save = async () => {
    const saved = await run(
      () => (id ? updateTestPrepCourse(row) : createTestPrepCourse(row)),
      {
        success: id ? "Course saved" : "Course created",
        failure: id ? "Couldn't save the course." : "Couldn't create the course.",
      },
    );
    if (!saved) return;
    setDirty(false);
    if (id) router.refresh();
    else router.push(`/admin/test-prep/${saved.id}`);
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
              value={row.status}
              onChange={(status) => set({ status })}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published", disabled: !canPublish },
                { value: "archived", label: "Archived" },
              ]}
              help={canPublish ? undefined : "You can save drafts. An admin puts a course live."}
            />

            <TextField
              name="sortOrder"
              label="Display order"
              type="number"
              help="Lower numbers appear first."
              value={String(row.sortOrder)}
              onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
            />

            {errors.publish?.length ? (
              <ErrorState title="This cannot go live yet" description={errors.publish.join(" ")} />
            ) : null}

            {value.id ? (
              <div className="flex">
                {value.status === "published" ? (
                  <ViewOnSiteButton href={`/test-preparation/${value.slug}`} />
                ) : (
                  <PreviewButton href={`/preview/test-prep/${value.slug}`} />
                )}
              </div>
            ) : null}
          </SectionCard>
        }
      >
        <SectionCard title="Course information">
          <TextField
            name="name"
            label="Course name"
            required
            value={row.name}
            error={errors.name?.[0]}
            onChange={(name) => {
              set(slugTouched ? { name } : { name, slug: slugify(name) });
            }}
          />

          <TextField
            name="slug"
            label="URL slug"
            required
            help="Used in the page address."
            value={row.slug}
            error={errors.slug?.[0]}
            onChange={(slug) => {
              setSlugTouched(true);
              set({ slug });
            }}
          />

          <SelectField
            name="testType"
            label="Test"
            required
            value={row.testType}
            error={errors.testType?.[0]}
            onChange={(testType) => set({ testType })}
            options={[
              { value: "ielts", label: "IELTS" },
              { value: "pte", label: "PTE" },
            ]}
          />

          <TextAreaField
            name="summary"
            label="Summary"
            rows={3}
            value={row.summary}
            error={errors.summary?.[0]}
            onChange={(summary) => set({ summary })}
          />
        </SectionCard>

        <SectionCard title="Description">
          <RichText value={value.descriptionHtml} onChange={(descriptionHtml) => set({ descriptionHtml })} />

          <Repeater<SyllabusItem>
            label="Syllabus"
            items={row.syllabus}
            blank={() => ({ title: "", body: "" })}
            onChange={(syllabus) => set({ syllabus })}
            addLabel="Add a section"
            emptyLabel="No syllabus yet. A course needs one before it can go live."
          >
            {(item, update) => (
              <>
                <TextField label="Heading" required value={item.title} onChange={(title) => update({ title })} />
                <TextAreaField
                  label="What it covers"
                  required
                  rows={3}
                  value={item.body}
                  onChange={(body) => update({ body })}
                />
              </>
            )}
          </Repeater>
        </SectionCard>

        <SectionCard title="Course image">
          <MediaPicker
            label="Image"
            name="heroImageId"
            value={row.heroImageId ? (media[row.heroImageId] ?? null) : null}
            onChange={(heroImageId) => set({ heroImageId })}
          />
        </SectionCard>

        <SectionCard title="Fee" description="What a batch charges unless it sets its own fee.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="defaultFee"
              label="Fee"
              value={row.defaultFee}
              error={errors.defaultFee?.[0]}
              onChange={(defaultFee) => set({ defaultFee })}
            />
            <TextField
              name="feeCurrency"
              label="Currency"
              required
              help="Three letters, like NPR."
              value={row.feeCurrency}
              error={errors.feeCurrency?.[0]}
              onChange={(feeCurrency) => set({ feeCurrency })}
            />
          </div>
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
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 />
                  Delete
                </Button>
              }
              title={`Delete ${row.name || "this course"}?`}
              description="This cannot be undone. A course with batches has to have those deleted first."
              confirmLabel="Delete course"
              onConfirm={async () => {
                const deleted = await run(() => deleteTestPrepCourse({ id }), {
                  success: "Course deleted",
                  failure: "Couldn't delete the course.",
                });
                if (deleted) {
                  setDirty(false);
                  router.push("/admin/test-prep");
                }
              }}
            />
          ) : null
        }
      />

      <ConfirmDialog
        open={confirmingPublish}
        onOpenChange={setConfirmingPublish}
        title="Publish this course?"
        description="It will become visible on the public website, along with its batches."
        confirmLabel="Publish"
        destructive={false}
        onConfirm={save}
      />
    </form>
  );
}
