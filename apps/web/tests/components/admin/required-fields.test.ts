import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// A field the zod schema refuses to save without has to carry the marker, or the editor asks
// people to guess. Keyed by label because that is what the person filling the form reads.
const MARKED: Record<string, string[]> = {
  "src/features/posts/components/post-form.tsx": ['label="Title"'],
  "src/features/events/components/event-form.tsx": [
    'label="Title"',
    'label="Starts"',
    'label="Joining link"',
    'label="Venue"',
  ],
  "src/features/team/components/team-editor.tsx": ['label="Full name"'],
  "src/features/partners/components/partner-editor.tsx": ['label="Partner name"'],
  "src/features/institutions/components/institution-editor.tsx": [
    'label="Institution name"',
    'label="URL slug"',
  ],
  "src/features/institutions/components/institution-gallery.tsx": ["label={`Picture "],
  "src/features/courses/components/course-editor.tsx": [
    'label="Course name"',
    'label="Institution"',
    'label="URL slug"',
  ],
  "src/features/test-prep/components/course-editor.tsx": [
    'label="Course name"',
    'label="URL slug"',
    'label="Test"',
    'label="Heading"',
    'label="What it covers"',
    'label="Currency"',
  ],
  "src/features/test-prep/components/batch-editor.tsx": [
    'label="Course"',
    'label="Batch name"',
    'label="First class"',
    'label="Total seats"',
  ],
  "src/features/users/components/user-editor.tsx": [
    'label="Name"',
    'label="Email"',
    'label="Password"',
    'label="Role"',
  ],
  "src/features/posts/components/tag-manager.tsx": ['label="Name"'],
  "src/features/posts/components/post-category-manager.tsx": ['label="Name"'],
  "src/features/courses/components/course-category-manager.tsx": ['label="Name"'],
};

// The element runs from its opening tag to the `/>` that closes it. An arrow function in an
// attribute puts a `>` inside the tag, so the closing one is found by line instead.
function element(source: string, label: string) {
  const at = source.indexOf(label);
  expect(at, `${label} is not in the file`).toBeGreaterThan(-1);
  expect(source.indexOf(label, at + 1), `${label} appears more than once`).toBe(-1);

  const open = source.lastIndexOf("<", at);
  const close = source.indexOf("/>", at);
  return source.slice(open, close);
}

for (const [file, labels] of Object.entries(MARKED)) {
  test(`${file} marks its mandatory fields`, () => {
    const source = readFileSync(file, "utf8");
    for (const label of labels) {
      expect(element(source, label), `${label} is missing the required marker`).toMatch(
        /\brequired\b/,
      );
    }
  });
}

test("the marker is drawn in the destructive colour and hidden from screen readers", () => {
  const source = readFileSync("src/components/shared/admin/fields.tsx", "utf8");
  const start = source.indexOf("export function FieldLabel");
  const body = source.slice(start, source.indexOf("\nexport function ", start + 1));

  expect(body).toContain("text-destructive");
  expect(body).toContain("aria-hidden");
});
