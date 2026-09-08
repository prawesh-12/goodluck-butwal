import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { offices, testPrepBatches, testPrepCourses } from "../schema";

// IELTS and PTE are the two tests named in content/services.ts. Nothing else here is copy:
// summary, description, syllabus and fee stay empty until the client supplies them.
const COURSES = [
  { slug: "ielts", name: "IELTS", testType: "ielts" as const },
  { slug: "pte", name: "PTE", testType: "pte" as const },
];

// PENDING-DECISION: Q-004. No real batch data exists, so these four are marked in their own
// name and are only created under --dev, the same gate the placeholder catalogue uses.
const DEV = process.argv.includes("--dev");

const PLACEHOLDER_BATCHES = [
  { batchName: "[PLACEHOLDER] Morning batch", courseSlug: "ielts", inDays: 14, days: [1, 3, 5], start: "07:00", end: "09:00", mode: "in_person" as const, totalSeats: 20, seatsTaken: 4 },
  { batchName: "[PLACEHOLDER] Evening batch", courseSlug: "ielts", inDays: 21, days: [1, 2, 3, 4, 5], start: "17:00", end: "19:00", mode: "hybrid" as const, totalSeats: 20, seatsTaken: 17 },
  { batchName: "[PLACEHOLDER] Online batch", courseSlug: "pte", inDays: 28, days: [0, 6], start: "10:00", end: "12:00", mode: "online" as const, totalSeats: 15, seatsTaken: 15 },
  { batchName: "[PLACEHOLDER] Day batch", courseSlug: "pte", inDays: 35, days: [1, 3], start: "13:00", end: "15:00", mode: "in_person" as const, totalSeats: 25, seatsTaken: 0 },
];

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export async function seedTestPrep() {
  const [office] = await db.select({ id: offices.id }).from(offices).where(eq(offices.code, "np"));

  for (const [index, course] of COURSES.entries()) {
    const row = {
      slug: course.slug,
      name: course.name,
      testType: course.testType,
      officeId: office?.id ?? null,
      feeCurrency: "NPR",
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
    };
    await db
      .insert(testPrepCourses)
      .values(row)
      .onConflictDoUpdate({ target: testPrepCourses.slug, set: { ...row, updatedAt: new Date() } });
  }

  if (!DEV) return COURSES.length;

  const courseIds = new Map(
    (await db.select({ id: testPrepCourses.id, slug: testPrepCourses.slug }).from(testPrepCourses)).map((c) => [
      c.slug,
      c.id,
    ]),
  );

  for (const batch of PLACEHOLDER_BATCHES) {
    const courseId = courseIds.get(batch.courseSlug);
    if (!courseId) continue;

    const row = {
      courseId,
      batchName: batch.batchName,
      startDate: inDays(batch.inDays),
      endDate: inDays(batch.inDays + 56),
      scheduleDays: batch.days,
      startTime: batch.start,
      endTime: batch.end,
      mode: batch.mode,
      totalSeats: batch.totalSeats,
      seatsTaken: batch.seatsTaken,
      status: "open" as const,
      notes: "[PLACEHOLDER] seeded for development, replace with the real batch.",
    };

    // No unique index covers a batch, so the natural key is matched by hand.
    const [existing] = await db
      .select({ id: testPrepBatches.id })
      .from(testPrepBatches)
      .where(and(eq(testPrepBatches.courseId, courseId), eq(testPrepBatches.batchName, batch.batchName)));

    if (existing) {
      await db.update(testPrepBatches).set({ ...row, updatedAt: new Date() }).where(eq(testPrepBatches.id, existing.id));
    } else {
      await db.insert(testPrepBatches).values(row);
    }
  }

  return COURSES.length + PLACEHOLDER_BATCHES.length;
}
