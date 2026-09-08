import { db } from "../client";
import { courseCategories, courses, institutions } from "../schema";
import { qualificationLevel } from "../schema/enums";

// The eight subject areas named in the plan. Real data, seeded everywhere.
const CATEGORIES = [
  { slug: "business-and-management", name: "Business and Management" },
  { slug: "information-technology", name: "Information Technology" },
  { slug: "engineering", name: "Engineering" },
  { slug: "health-and-nursing", name: "Health and Nursing" },
  { slug: "hospitality-and-tourism", name: "Hospitality and Tourism" },
  { slug: "education-and-teaching", name: "Education and Teaching" },
  { slug: "science", name: "Science" },
  { slug: "trades", name: "Trades" },
];

export async function seedCourseCategories() {
  for (const [index, category] of CATEGORIES.entries()) {
    const row = { ...category, sortOrder: index };
    await db
      .insert(courseCategories)
      .values(row)
      .onConflictDoUpdate({ target: courseCategories.slug, set: { ...row, updatedAt: new Date() } });
  }
  return CATEGORIES.length;
}

// Q-004 has no answer yet, so the fallback in the plan applies: ten institutions and forty
// courses, every one of them named [PLACEHOLDER], created only under --dev and left as drafts so
// nothing reaches the site. No institution name, description or course copy is invented here.
const DEV = process.argv.includes("--dev");
const LEVELS = qualificationLevel.enumValues;
const INTAKES = [["February", "July"], ["March", "August"], ["January", "May", "September"]];

export async function seedPlaceholderCatalogue() {
  if (!DEV) return 0;

  const categories = await db.select({ id: courseCategories.id }).from(courseCategories);
  if (categories.length === 0) return 0;

  const ids: string[] = [];
  for (let i = 1; i <= 10; i += 1) {
    const row = {
      slug: `placeholder-institution-${i}`,
      name: `[PLACEHOLDER] Institution ${i}`,
      country: "[PLACEHOLDER]",
      city: "[PLACEHOLDER]",
      isPartner: i % 3 === 0,
      isFeatured: i <= 3,
      status: "draft" as const,
      sortOrder: i,
    };
    const [saved] = await db
      .insert(institutions)
      .values(row)
      .onConflictDoUpdate({ target: institutions.slug, set: { ...row, updatedAt: new Date() } })
      .returning({ id: institutions.id });
    ids.push(saved.id);
  }

  for (let i = 1; i <= 40; i += 1) {
    const row = {
      slug: `placeholder-course-${i}`,
      name: `[PLACEHOLDER] Course ${i}`,
      institutionId: ids[i % ids.length],
      categoryId: categories[i % categories.length].id,
      qualificationLevel: LEVELS[i % LEVELS.length],
      durationMonths: 12 + (i % 4) * 12,
      durationLabel: `${1 + (i % 4)} years`,
      intakes: INTAKES[i % INTAKES.length],
      tuitionFeeMin: String(15000 + i * 100),
      tuitionFeeMax: String(25000 + i * 100),
      tuitionCurrency: "AUD",
      status: "draft" as const,
      sortOrder: i,
    };
    await db
      .insert(courses)
      .values(row)
      .onConflictDoUpdate({ target: courses.slug, set: { ...row, updatedAt: new Date() } });
  }

  return 50;
}
