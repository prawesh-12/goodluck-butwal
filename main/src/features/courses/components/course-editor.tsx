"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { Label } from "@/components/ui/admin/label";
import { cn } from "@/components/ui/admin/cn";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { AdvancedSection, EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { ComboboxField, SelectField, TextField } from "@/components/shared/admin/fields";
import { PreviewButton, ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import {
  INTAKE_MONTHS,
  QUALIFICATION_LABEL,
  coursePath,
  qualificationLevels,
} from "@/config/course-meta";
import { slugify } from "@/lib/utils/slug";
import { createCourse, deleteCourse, updateCourse } from "@/features/courses/actions";

const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

export type CourseValue = {
  id?: string;
  slug: string;
  name: string;
  institutionId: string;
  destinationId: string | null;
  country: string;
  qualificationLevel: string;
  categoryId: string;
  durationMonths: string;
  durationLabel: string;
  intakes: string[];
  tuitionFeeMin: string;
  tuitionFeeMax: string;
  tuitionCurrency: string;
  descriptionHtml: string;
  entryRequirementsHtml: string;
  status: string;
  sortOrder: number;
};

type Option = { id: string; name: string };

export function CourseEditor({
  value,
  institutions,
  categories,
  destinations,
  canDelete,
  canPublish,
}: {
  value: CourseValue;
  institutions: Option[];
  categories: Option[];
  destinations: Option[];
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState<CourseValue>(value);
  const [dirty, setDirty] = useState(false);
  const [askPublish, setAskPublish] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(value.id));

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = <K extends keyof CourseValue>(key: K, next: CourseValue[K]) => {
    setForm((current) => ({ ...current, [key]: next }));
    setDirty(true);
  };

  const setName = (name: string) => {
    setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
    setDirty(true);
  };

  // The saved address, not the one being typed: only what is stored has a page.
  const path = coursePath(value.slug);
  const goingLive = form.status === "published" && value.status !== "published";
  const publishProblems = errors.publish ?? [];

  const save = async () => {
    const id = form.id;
    const saved = await run(() => (id ? updateCourse({ ...form, id }) : createCourse(form)), {
      success: id ? "Course saved" : "Course created",
      failure: id ? "Couldn't save the course." : "Couldn't create the course.",
    });
    if (!saved) return;
    setDirty(false);
    if (id) router.refresh();
    else router.push(`/admin/courses/${saved.id}`);
  };

  const remove = async () => {
    const id = form.id;
    if (!id) return;
    const gone = await run(() => deleteCourse({ id }), {
      success: "Course deleted",
      failure: "Couldn't delete the course.",
    });
    if (!gone) return;
    setDirty(false);
    router.push("/admin/courses");
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (goingLive) setAskPublish(true);
        else void save();
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
              onChange={(status) => set("status", status)}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published", disabled: !canPublish },
                { value: "archived", label: "Archived" },
              ]}
            />
            <TextField
              name="sortOrder"
              label="Display order"
              type="number"
              help="Lower numbers appear first."
              value={String(form.sortOrder)}
              onChange={(sortOrder) => set("sortOrder", Number(sortOrder) || 0)}
            />

            {publishProblems.length > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>This cannot go live yet</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {publishProblems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {value.id ? (
              <div className="*:w-full">
                {value.status === "published" ? (
                  <ViewOnSiteButton href={path} />
                ) : (
                  <PreviewButton href={`/preview/course/${value.slug}`} />
                )}
              </div>
            ) : null}

            <WebAddress
              value={form.slug}
              error={errors.slug?.[0]}
              published={value.status === "published"}
              onChange={(slug) => {
                setSlugTouched(true);
                set("slug", slug);
              }}
            />
          </SectionCard>
        }
      >
        <SectionCard title="Course details">
          <TextField
            name="name"
            label="Course name"
            required
            value={form.name}
            onChange={setName}
            error={errors.name?.[0]}
          />
          <ComboboxField
            name="institutionId"
            label="Institution"
            required
            placeholder="Choose an institution"
            searchPlaceholder="Search institutions"
            emptyMessage="No institution by that name."
            value={form.institutionId}
            onChange={(institutionId) => set("institutionId", institutionId)}
            options={institutions.map((option) => ({ value: option.id, label: option.name }))}
            error={errors.institutionId?.[0]}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="destinationId"
              label="Destination"
              emptyLabel="Not set"
              value={form.destinationId ?? ""}
              onChange={(id) => set("destinationId", id || null)}
              options={destinations.map((option) => ({ value: option.id, label: option.name }))}
            />
            <TextField
              name="country"
              label="Country"
              value={form.country}
              onChange={(country) => set("country", country)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="qualificationLevel"
              label="Qualification"
              emptyLabel="Not set"
              value={form.qualificationLevel}
              onChange={(qualificationLevel) => set("qualificationLevel", qualificationLevel)}
              options={qualificationLevels.map((level) => ({ value: level, label: QUALIFICATION_LABEL[level] }))}
            />
            <SelectField
              name="categoryId"
              label="Subject area"
              emptyLabel="Not set"
              value={form.categoryId}
              onChange={(categoryId) => set("categoryId", categoryId)}
              options={categories.map((option) => ({ value: option.id, label: option.name }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="durationMonths"
              label="Length in months"
              type="number"
              value={form.durationMonths}
              onChange={(durationMonths) => set("durationMonths", durationMonths)}
              error={errors.durationMonths?.[0]}
            />
            <TextField
              name="durationLabel"
              label="Length in words"
              placeholder="3 years full time"
              value={form.durationLabel}
              onChange={(durationLabel) => set("durationLabel", durationLabel)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Intake">
          <IntakeMonths
            selected={form.intakes}
            error={errors.intakes?.[0]}
            onChange={(next) => set("intakes", next)}
          />
        </SectionCard>

        <SectionCard title="Course content">
          <RichText
            label="Description"
            value={form.descriptionHtml}
            onChange={(descriptionHtml: string) => set("descriptionHtml", descriptionHtml)}
          />
          <RichText
            label="Entry requirements"
            value={form.entryRequirementsHtml}
            onChange={(entryRequirementsHtml: string) => set("entryRequirementsHtml", entryRequirementsHtml)}
          />
        </SectionCard>

        <SectionCard title="Fees" description="Yearly tuition. Leave both empty to show no fee.">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              name="tuitionFeeMin"
              label="Fee from"
              value={form.tuitionFeeMin}
              onChange={(tuitionFeeMin) => set("tuitionFeeMin", tuitionFeeMin)}
              error={errors.tuitionFeeMin?.[0]}
            />
            <TextField
              name="tuitionFeeMax"
              label="Fee to"
              value={form.tuitionFeeMax}
              onChange={(tuitionFeeMax) => set("tuitionFeeMax", tuitionFeeMax)}
              error={errors.tuitionFeeMax?.[0]}
            />
            <TextField
              name="tuitionCurrency"
              label="Currency"
              placeholder="AUD"
              value={form.tuitionCurrency}
              onChange={(tuitionCurrency) => set("tuitionCurrency", tuitionCurrency)}
              error={errors.tuitionCurrency?.[0]}
            />
          </div>
        </SectionCard>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={form.id ? "Save" : "Create course"}
        destructive={
          canDelete && form.id ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 />
                  Delete
                </Button>
              }
              title="Delete this course?"
              description="This cannot be undone."
              confirmLabel="Delete course"
              onConfirm={remove}
            />
          ) : null
        }
      />

      <ConfirmDialog
        open={askPublish}
        onOpenChange={setAskPublish}
        title="Publish this course?"
        description="It will become visible on the public website."
        confirmLabel="Publish"
        destructive={false}
        onConfirm={save}
      />
    </form>
  );
}

// Laid out three to a row in calendar order, so the year reads as a grid rather than a list of
// twelve unrelated tickboxes.
function IntakeMonths({
  selected,
  error,
  onChange,
}: {
  selected: string[];
  error?: string;
  onChange: (months: string[]) => void;
}) {
  const id = useId();
  const toggle = (month: string) =>
    onChange(
      INTAKE_MONTHS.filter((each) =>
        each === month ? !selected.includes(month) : selected.includes(each),
      ),
    );

  return (
    <div role="group" aria-labelledby={id} data-field="intakes" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label id={id}>Intake months</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={selected.length === INTAKE_MONTHS.length}
            onClick={() => onChange([...INTAKE_MONTHS])}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={selected.length === 0}
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INTAKE_MONTHS.map((month) => {
          const on = selected.includes(month);
          return (
            <Button
              key={month}
              type="button"
              aria-pressed={on}
              variant={on ? "default" : "outline"}
              className="justify-start"
              onClick={() => toggle(month)}
            >
              <Check className={cn(on ? "opacity-100" : "opacity-0")} />
              {month}
            </Button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function WebAddress({
  value,
  error,
  published,
  onChange,
}: {
  value: string;
  error?: string;
  published: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <AdvancedSection open={Boolean(error)}>
      <TextField
        name="slug"
        label="URL slug"
        required
        help={published ? "The old address keeps working and sends people to the new one." : undefined}
        value={value}
        onChange={onChange}
        error={error}
      />
    </AdvancedSection>
  );
}
