"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field, Repeater, SaveBar, Select, TextArea } from "@/components/shared/admin/repeater";
import { SeoFields, type SeoValue } from "@/components/shared/admin/page-seo-fields";
import {
  createTestPrepCourse,
  deleteTestPrepCourse,
  updateTestPrepCourse,
} from "@/features/test-prep/actions";

type SyllabusItem = { title: string; body: string };

export type CourseValue = SeoValue & {
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

// One line rather than an import: a client component that pulls in a validator drags zod into
// the browser bundle, which is at its cap.
const coursePath = (slug: string) => `/test-preparation/${slug}`;

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
  const [row, setRow] = useState<CourseValue>(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<CourseValue>) => setRow((current) => ({ ...current, ...patch }));
  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const path = coursePath(row.slug);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateTestPrepCourse(row) : await createTestPrepCourse(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/test-prep/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field
        label="Course name"
        help="The name at the top of the course page and in the batch list."
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

      <Select
        label="Test"
        help="Which test this course prepares people for. Visitors filter the batch table by it."
        value={row.testType}
        onChange={(testType) => set({ testType })}
        options={[
          { value: "ielts", label: "IELTS" },
          { value: "pte", label: "PTE" },
        ]}
        error={errors.testType?.[0]}
      />

      <Field
        label="Summary"
        help="The one line under the name, on the test preparation page and in lists."
        value={row.summary}
        onChange={(summary) => set({ summary })}
      />

      <TextArea
        label="Description"
        help="The main text on the course page."
        rows={8}
        value={row.descriptionHtml}
        onChange={(descriptionHtml) => set({ descriptionHtml })}
      />

      <Repeater<SyllabusItem>
        label="Syllabus"
        help="What the course covers. Each line becomes a bullet on the course page."
        items={row.syllabus}
        blank={() => ({ title: "", body: "" })}
        onChange={(syllabus) => set({ syllabus })}
        addLabel="Add a syllabus section"
        emptyLabel="No syllabus yet. A course cannot go live without one."
      >
        {(item, update) => (
          <>
            <Field label="Heading" value={item.title} onChange={(title) => update({ title })} />
            <TextArea label="What it covers" rows={3} value={item.body} onChange={(body) => update({ body })} />
          </>
        )}
      </Repeater>

      <MediaPicker
        label="Course picture"
        name="heroImageId"
        value={pick(row.heroImageId)}
        help="Shown at the top of the course page."
        onChange={(heroImageId) => set({ heroImageId })}
      />

      <Field
        label="Fee"
        help="The usual price of the course. A batch can charge something else. Leave empty to show no price."
        value={row.defaultFee}
        onChange={(defaultFee) => set({ defaultFee })}
        error={errors.defaultFee?.[0]}
      />

      <Field
        label="Currency"
        help="Three letters, like NPR."
        value={row.feeCurrency}
        onChange={(feeCurrency) => set({ feeCurrency })}
        error={errors.feeCurrency?.[0]}
      />

      <h2 className="t-h5 admin-subhead">Publishing</h2>

      <Field
        label="Order"
        type="number"
        help="Lower numbers come first on the test preparation page."
        value={String(row.sortOrder)}
        onChange={(sortOrder) => set({ sortOrder: Number(sortOrder) || 0 })}
      />

      <Select
        label="Status"
        help="Only published courses are on the site. Their batches are hidden with them."
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
                const result = await deleteTestPrepCourse({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/test-prep");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
