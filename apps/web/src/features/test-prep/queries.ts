import { cache } from "react";
import { TAGS, cached } from "@/lib/cache";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets, offices, teamMembers, testPrepBatches, testPrepCourses } from "@goodluck/db/schema";
import type { BatchStatus } from "@/features/test-prep/seats";
import { mediaUrl } from "@/lib/utils/media-url";

export type PublicCourse = {
  id: string;
  slug: string;
  name: string;
  testType: "ielts" | "pte";
  summary: string;
  descriptionHtml: string;
  syllabus: { title: string; body: string }[];
  fee: string | null;
  feeCurrency: string;
  image: string;
  imageAlt: string;
  timezone: string;
};

export type PublicBatch = {
  id: string;
  courseSlug: string;
  courseName: string;
  testType: "ielts" | "pte";
  batchName: string;
  startDate: string;
  endDate: string | null;
  scheduleDays: number[];
  startTime: string | null;
  endTime: string | null;
  mode: "in_person" | "online" | "hybrid";
  trainer: string | null;
  totalSeats: number;
  seatsTaken: number;
  status: BatchStatus;
  fee: string | null;
  feeCurrency: string;
  timezone: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const listTestPrepCoursesUncached = cached(async (): Promise<PublicCourse[]> => {
  const rows = await db
    .select({
      id: testPrepCourses.id,
      slug: testPrepCourses.slug,
      name: testPrepCourses.name,
      testType: testPrepCourses.testType,
      summary: testPrepCourses.summary,
      descriptionHtml: testPrepCourses.descriptionHtml,
      syllabus: testPrepCourses.syllabus,
      fee: testPrepCourses.defaultFee,
      feeCurrency: testPrepCourses.feeCurrency,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      imageAlt: mediaAssets.altText,
      timezone: offices.timezone,
    })
    .from(testPrepCourses)
    .leftJoin(mediaAssets, eq(testPrepCourses.heroImageId, mediaAssets.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
    .where(eq(testPrepCourses.status, "published"))
    .orderBy(asc(testPrepCourses.sortOrder), asc(testPrepCourses.name));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    testType: row.testType,
    summary: row.summary ?? "",
    descriptionHtml: row.descriptionHtml ?? "",
    syllabus: row.syllabus ?? [],
    fee: row.fee,
    feeCurrency: row.feeCurrency,
    image: mediaUrl(row, 960),
    imageAlt: row.imageAlt ?? "",
    // Batch times are office-local, so a course with no office falls back to the Nepal zone.
    timezone: row.timezone ?? "Asia/Kathmandu",
  }));
}, ["test-prep-courses"], [TAGS.testPrep]);

export const listTestPrepCourses = cache(listTestPrepCoursesUncached);

export const getTestPrepCourse = cache(async (slug: string) =>
  (await listTestPrepCourses()).find((course) => course.slug === slug),
);

const batchColumns = {
  id: testPrepBatches.id,
  courseSlug: testPrepCourses.slug,
  courseName: testPrepCourses.name,
  testType: testPrepCourses.testType,
  batchName: testPrepBatches.batchName,
  startDate: testPrepBatches.startDate,
  endDate: testPrepBatches.endDate,
  scheduleDays: testPrepBatches.scheduleDays,
  startTime: testPrepBatches.startTime,
  endTime: testPrepBatches.endTime,
  mode: testPrepBatches.mode,
  trainer: teamMembers.fullName,
  totalSeats: testPrepBatches.totalSeats,
  seatsTaken: testPrepBatches.seatsTaken,
  status: testPrepBatches.status,
  fee: testPrepBatches.fee,
  feeCurrency: testPrepCourses.feeCurrency,
  timezone: offices.timezone,
};

type BatchRow = {
  scheduleDays: number[] | null;
  timezone: string | null;
  fee: string | null;
} & Omit<PublicBatch, "scheduleDays" | "timezone" | "fee">;

const shape = (rows: BatchRow[]): PublicBatch[] =>
  rows.map((row) => ({ ...row, scheduleDays: row.scheduleDays ?? [], timezone: row.timezone ?? "Asia/Kathmandu" }));

// Past batches never show. A batch is upcoming until the day it starts.
export const listUpcomingBatches = cache(async (): Promise<PublicBatch[]> => {
  const rows = await db
    .select(batchColumns)
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .leftJoin(teamMembers, eq(testPrepBatches.trainerId, teamMembers.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
    .where(and(eq(testPrepCourses.status, "published"), gte(testPrepBatches.startDate, today())))
    .orderBy(asc(testPrepBatches.startDate));

  return shape(rows);
});

export const upcomingBatchesForCourse = cache(async (courseId: string): Promise<PublicBatch[]> => {
  const rows = await db
    .select(batchColumns)
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .leftJoin(teamMembers, eq(testPrepBatches.trainerId, teamMembers.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
    .where(and(eq(testPrepBatches.courseId, courseId), gte(testPrepBatches.startDate, today())))
    .orderBy(asc(testPrepBatches.startDate));

  return shape(rows);
});

// The registration endpoint needs the seat counts and the office the batch belongs to.
export async function batchForRegistration(id: string) {
  const [row] = await db
    .select({
      id: testPrepBatches.id,
      batchName: testPrepBatches.batchName,
      totalSeats: testPrepBatches.totalSeats,
      seatsTaken: testPrepBatches.seatsTaken,
      status: testPrepBatches.status,
      startDate: testPrepBatches.startDate,
      mode: testPrepBatches.mode,
      courseStatus: testPrepCourses.status,
      courseName: testPrepCourses.name,
      officeCode: offices.code,
      officeName: offices.name,
      officeAddress: offices.addressLine1,
      officePhone: offices.phoneDisplay,
    })
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
    .where(eq(testPrepBatches.id, id));
  return row;
}
