import { db } from "@goodluck/db";
import { services, uiStrings } from "@goodluck/db/schema";
import { services as source } from "./source/services";

// The bento tones the homepage already paints these cards in, in slug order.
const TONE: Record<string, string> = {
  "education-counselling": "blue",
  "visa-guidance": "dark",
  "scholarship-guidance": "surface",
  "ielts-coaching": "white",
};

const CATEGORY: Record<string, "education" | "study_abroad" | "test_prep" | "migration"> = {
  "education-counselling": "education",
  "visa-guidance": "migration",
  "scholarship-guidance": "education",
  "ielts-coaching": "test_prep",
};

// Rendered but with no column of their own, so they live as interface text.
async function putString(key: string, value: string, label: string, help: string) {
  await db
    .insert(uiStrings)
    .values({ key, value, group: "services", label, help })
    .onConflictDoUpdate({ target: uiStrings.key, set: { label, help } });
}

export async function seedServices() {
  for (const [index, service] of source.entries()) {
    const row = {
      slug: service.slug,
      name: service.title,
      category: CATEGORY[service.slug],
      officeScope: "both" as const,
      summary: service.line,
      introHtml: service.intro,
      steps: service.steps.map((s) => ({ title: s.title, body: s.line })),
      facts: service.facts?.map((f) => ({ label: f.label, value: f.value })) ?? null,
      documents: service.list?.map((label) => ({ label })) ?? null,
      tone: TONE[service.slug],
      isFeatured: true,
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
    };

    await db
      .insert(services)
      .values(row)
      .onConflictDoUpdate({ target: services.slug, set: { ...row, updatedAt: new Date() } });

    await putString(`service.${service.slug}.label`, service.label, `${service.title} badge`, "The short word on the homepage card.");
    await putString(`service.${service.slug}.stepsTitle`, service.stepsTitle, `${service.title} steps heading`, "The heading above the numbered steps.");
    if (service.listTitle) {
      await putString(`service.${service.slug}.listTitle`, service.listTitle, `${service.title} documents heading`, "The heading above the documents list.");
    }
  }
  return source.length;
}
