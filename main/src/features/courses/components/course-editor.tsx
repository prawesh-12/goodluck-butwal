"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { CheckboxGroup, SelectField, TextField } from "@/components/shared/admin/fields";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import {
  INTAKE_MONTHS,
  QUALIFICATION_LABEL,
  coursePath,
  qualificationLevels,
} from "@/config/course-meta";
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

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = <K extends keyof CourseValue>(key: K, next: CourseValue[K]) => {
    setForm((current) => ({ ...current, [key]: next }));
    setDirty(true);
  };

  const path = coursePath(form.slug);
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
            <TextField
              name="sortOrder"
              label="Display order"
              type="number"
              help="Lower numbers appear first."
              value={String(form.sortOrder)}
              onChange={(sortOrder) => set("sortOrder", Number(sortOrder) || 0)}
            />
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
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={path} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  View on site
                </a>
              </Button>
            ) : null}
          </SectionCard>
        }
      >
        <SectionCard title="Course details">
          <TextField
            name="name"
            label="Name"
            value={form.name}
            onChange={(name) => set("name", name)}
            error={errors.name?.[0]}
          />
          <TextField
            name="slug"
            label="URL slug"
            help="Used in the page address."
            value={form.slug}
            onChange={(slug) => set("slug", slug)}
            error={errors.slug?.[0]}
          />
          <SelectField
            name="institutionId"
            label="Institution"
            placeholder="Choose an institution"
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
          <CheckboxGroup
            name="intakes"
            label="Intake months"
            help="The months a student can start this course."
            options={INTAKE_MONTHS.map((month) => ({ value: month, label: month }))}
            selected={form.intakes}
            onChange={(next) => set("intakes", INTAKE_MONTHS.filter((month) => next.includes(month)))}
            columns={4}
            error={errors.intakes?.[0]}
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
          <div className="grid gap-5 sm:grid-cols-2">
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
