"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Field, SaveBar, Select } from "@/components/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/admin/page-seo-fields";
import type { PickedMedia } from "@/components/admin/media-picker";
import {
  INTAKE_MONTHS,
  QUALIFICATION_LABEL,
  coursePath,
  qualificationLevels,
} from "@/components/admin/course-meta";
import { createCourse, deleteCourse, updateCourse } from "@/server/actions/courses";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

const RichText = dynamic(() => import("./editor-rich-text"), { ssr: false });

export type CourseValue = SeoValue & {
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
  shareImage,
  canDelete,
  canPublish,
}: {
  value: CourseValue;
  institutions: Option[];
  categories: Option[];
  destinations: Option[];
  shareImage: PickedMedia | null;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [row, setRow] = useState<CourseValue>(value);
  const [institutionName, setInstitutionName] = useState(
    institutions.find((option) => option.id === value.institutionId)?.name ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<CourseValue>) => setRow((current) => ({ ...current, ...patch }));
  const path = coursePath(row.slug);

  const chooseInstitution = (name: string) => {
    setInstitutionName(name);
    const match = institutions.find((option) => option.name.toLowerCase() === name.trim().toLowerCase());
    set({ institutionId: match?.id ?? "" });
  };

  const toggleIntake = (month: string) =>
    set({
      intakes: row.intakes.includes(month)
        ? row.intakes.filter((taken) => taken !== month)
        : INTAKE_MONTHS.filter((known) => known === month || row.intakes.includes(known)),
    });

  return (
    <form id="admin-course-form"
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateCourse(row) : await createCourse(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/courses/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <UnsavedGuard formId="admin-course-form" />
      <Field
        label="Name"
        help="The course name on the course card and at the top of its page."
        value={row.name}
        onChange={(name) => set({ name })}
        error={errors.name?.[0]}
      />

      <Field
        label="Web address"
        help={`This course will live at ${path}. Changing it leaves a redirect behind so old links still work.`}
        value={row.slug}
        onChange={(slug) => set({ slug })}
        error={errors.slug?.[0]}
      />

      <label className="admin-field">
        <span className="t-small">Institution</span>
        <input
          list="course-institutions"
          value={institutionName}
          onChange={(event) => chooseInstitution(event.target.value)}
          placeholder="Start typing an institution name"
        />
        <span className="t-small admin-help">
          The institution that runs this course. Start typing to find it. A course cannot be saved
          without one.
        </span>
        {errors.institutionId?.[0] ? <span className="admin-clash">{errors.institutionId[0]}</span> : null}
        {institutionName && !row.institutionId ? (
          <span className="admin-clash">No institution has that name. Pick one from the list.</span>
        ) : null}
      </label>
      <datalist id="course-institutions">
        {institutions.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>

      <Select
        label="Qualification level"
        help="Groups the course under Bachelor, Master and so on in the course filters."
        value={row.qualificationLevel}
        onChange={(qualificationLevel) => set({ qualificationLevel })}
        options={[
          { value: "", label: "Not set" },
          ...qualificationLevels.map((level) => ({ value: level, label: QUALIFICATION_LABEL[level] })),
        ]}
      />

      <Select
        label="Subject area"
        help="The subject group on the course card and in the course filters."
        value={row.categoryId}
        onChange={(categoryId) => set({ categoryId })}
        options={[{ value: "", label: "Not set" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
      />

      <Select
        label="Destination"
        help="Which study destination page this course is listed under."
        value={row.destinationId ?? ""}
        onChange={(destinationId) => set({ destinationId: destinationId || null })}
        options={[{ value: "", label: "Not set" }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
      />

      <Field
        label="Country"
        help="Shown on the course card. Left empty, the institution's country is used."
        value={row.country}
        onChange={(country) => set({ country })}
      />

      <fieldset className="admin-field">
        <span className="t-small">Intakes</span>
        <span className="t-small admin-help">
          The months a student can start. These are the ticks in the intake filter on the courses
          page.
        </span>
        <div className="admin-actions" style={{ flexWrap: "wrap" }}>
          {INTAKE_MONTHS.map((month) => (
            <label key={month} className="t-small">
              <input
                type="checkbox"
                checked={row.intakes.includes(month)}
                onChange={() => toggleIntake(month)}
              />{" "}
              {month}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Length in months"
        type="number"
        help="A whole number. Used to sort and filter courses by length."
        value={row.durationMonths}
        onChange={(durationMonths) => set({ durationMonths })}
        error={errors.durationMonths?.[0]}
      />

      <Field
        label="Length as words"
        help="What a student reads on the card, like 3 years full time."
        value={row.durationLabel}
        onChange={(durationLabel) => set({ durationLabel })}
      />

      <Field
        label="Fee from"
        help="The lowest yearly tuition fee. Numbers only, no commas or currency symbol."
        value={row.tuitionFeeMin}
        onChange={(tuitionFeeMin) => set({ tuitionFeeMin })}
        error={errors.tuitionFeeMin?.[0]}
      />
      <Field
        label="Fee to"
        help="The highest yearly tuition fee. Leave both empty to show no fee at all."
        value={row.tuitionFeeMax}
        onChange={(tuitionFeeMax) => set({ tuitionFeeMax })}
        error={errors.tuitionFeeMax?.[0]}
      />
      <Field
        label="Currency"
        help="Three letters, like AUD or NPR. Shown next to the fee."
        value={row.tuitionCurrency}
        onChange={(tuitionCurrency) => set({ tuitionCurrency })}
        error={errors.tuitionCurrency?.[0]}
      />

      <RichText
        label="Description"
        help="The main body of the course page."
        value={row.descriptionHtml}
        onChange={(descriptionHtml) => set({ descriptionHtml })}
      />

      <RichText
        label="Entry requirements"
        help="What a student needs to be accepted. Shown in its own section on the course page."
        value={row.entryRequirementsHtml}
        onChange={(entryRequirementsHtml) => set({ entryRequirementsHtml })}
      />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <Field
        label="Order"
        type="number"
        help="Lower numbers come first in the course list."
        value={String(row.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />
      <Select
        label="Status"
        help="Only published courses are on the site."
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
        fallbackDescription={institutionName}
        ogImage={row.seoOgImageId ? shareImage : null}
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
                const result = await deleteCourse({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/courses");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}