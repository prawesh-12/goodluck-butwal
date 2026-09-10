import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { destinationFaqs, destinations, serviceFaqs, services, uiStrings } from "@db/schema";
import { destinations as source } from "./source/destinations";
import { faqs } from "./source/faqs";

const COUNTRY_CODE: Record<string, string> = { australia: "AU", "united-kingdom": "GB", "new-zealand": "NZ" };

// Section headings are rendered but have no column, so they live as interface text.
async function putString(key: string, value: string, label: string, help: string) {
  await db
    .insert(uiStrings)
    .values({ key, value, group: "destinations", label, help })
    .onConflictDoUpdate({ target: uiStrings.key, set: { label, help } });
}

export async function seedDestinations() {
  for (const [index, d] of source.entries()) {
    const row = {
      slug: d.slug,
      name: d.name,
      countryCode: COUNTRY_CODE[d.slug] ?? null,
      overviewHtml: d.overview,
      academicHtml: d.academic,
      workHtml: d.work,
      highlights: d.highlights.map((h) => ({ label: h.title, value: h.line })),
      why: d.why.map((text) => ({ text })),
      checklist: d.checklist?.map((text) => ({ text })) ?? null,
      // No intakes in the source, the client has to supply them.
      intakes: null,
      migration: d.migration.map((m) => ({ title: m.title, body: m.line })),
      costs: d.costs?.map((c) => ({ label: c.title, amount: 0, currency: "AUD", note: c.line })) ?? null,
      help: d.help.map((h) => ({ title: h.title, body: h.line })),
      isFeatured: true,
      hasPage: true,
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
    };

    await db
      .insert(destinations)
      .values(row)
      .onConflictDoUpdate({ target: destinations.slug, set: { ...row, updatedAt: new Date() } });

    await putString(`destination.${d.slug}.migrationTitle`, d.migrationTitle, `${d.name} migration heading`, "Heading above the migration blocks.");
    await putString(`destination.${d.slug}.whyTitle`, d.whyTitle, `${d.name} reasons heading`, "Heading above the reasons list.");
    if (d.checklistTitle) {
      await putString(`destination.${d.slug}.checklistTitle`, d.checklistTitle, `${d.name} checklist heading`, "Heading above the checklist.");
    }
  }

  // New Zealand is a card that routes to the booking form until the client supplies copy.
  const nz = {
    slug: "new-zealand",
    name: "New Zealand",
    countryCode: "NZ",
    hasPage: false,
    status: "published" as const,
    publishedAt: new Date(),
    sortOrder: source.length,
  };
  await db
    .insert(destinations)
    .values(nz)
    .onConflictDoUpdate({ target: destinations.slug, set: { ...nz, updatedAt: new Date() } });

  return source.length + 1;
}

// The five questions are written against education and migration, which map onto the two
// services that already carry those topics.
export async function seedFaqs() {
  const rows = await db.select({ id: services.id, slug: services.slug }).from(services);
  const serviceId = new Map(rows.map((r) => [r.slug, r.id]));

  const pairs: { serviceSlug: string; items: { q: string; a: string }[] }[] = [
    { serviceSlug: "education-counselling", items: faqs.education },
    { serviceSlug: "visa-guidance", items: faqs.migration },
  ];

  let count = 0;
  for (const { serviceSlug, items } of pairs) {
    const id = serviceId.get(serviceSlug);
    if (!id) continue;
    await db.delete(serviceFaqs).where(eq(serviceFaqs.serviceId, id));
    for (const [index, item] of items.entries()) {
      await db.insert(serviceFaqs).values({
        serviceId: id,
        question: item.q,
        answerHtml: item.a,
        sortOrder: index,
      });
      count += 1;
    }
  }

  // Australia is the only destination the questions actually describe.
  const [australia] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, "australia"));

  if (australia) {
    await db.delete(destinationFaqs).where(eq(destinationFaqs.destinationId, australia.id));
    for (const [index, item] of faqs.education.entries()) {
      await db.insert(destinationFaqs).values({
        destinationId: australia.id,
        question: item.q,
        answerHtml: item.a,
        sortOrder: index,
      });
    }
  }
  return count;
}
