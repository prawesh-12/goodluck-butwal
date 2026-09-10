import { and, asc, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import {
  offices,
  teamMembers,
  testPrepBatches,
  testPrepCourses,
  testPrepRegistrations,
} from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/auth/rbac";

export const PAGE_SIZE = 25;

export type CourseFilters = { q?: string; status?: string; testType?: string; page?: number };
export type BatchFilters = { q?: string; course?: string; status?: string; mode?: string; page?: number };
export type RegistrationFilters = { q?: string; batch?: string; status?: string; from?: string; to?: string; page?: number };

function combine(parts: (SQL | undefined)[]) {
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminCourses(actor: Actor, f: CourseFilters) {
  const where = combine([
    scopedWhere(testPrepCourses, actor),
    f.q ? or(ilike(testPrepCourses.name, `%${f.q}%`), ilike(testPrepCourses.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(testPrepCourses.status, f.status as "draft") : undefined,
    f.testType ? eq(testPrepCourses.testType, f.testType as "ielts") : undefined,
  ]);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: testPrepCourses.id,
        slug: testPrepCourses.slug,
        name: testPrepCourses.name,
        testType: testPrepCourses.testType,
        status: testPrepCourses.status,
        fee: testPrepCourses.defaultFee,
        feeCurrency: testPrepCourses.feeCurrency,
        office: offices.name,
        updatedAt: testPrepCourses.updatedAt,
      })
      .from(testPrepCourses)
      .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
      .where(where)
      .orderBy(asc(testPrepCourses.sortOrder), asc(testPrepCourses.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(testPrepCourses).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminCourse(id: string) {
  const [row] = await db.select().from(testPrepCourses).where(eq(testPrepCourses.id, id));
  return row;
}

export async function courseSlugsInUse(exceptId?: string) {
  const rows = await db.select({ id: testPrepCourses.id, slug: testPrepCourses.slug }).from(testPrepCourses);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}

export async function courseOptions() {
  return db
    .select({ id: testPrepCourses.id, name: testPrepCourses.name, testType: testPrepCourses.testType })
    .from(testPrepCourses)
    .orderBy(asc(testPrepCourses.name));
}

// A batch is taught by the office that owns its course, so only that office's people can train it.
export async function trainerOptions(officeCode: "np" | "au" = "np") {
  return db
    .select({ id: teamMembers.id, name: teamMembers.fullName, position: teamMembers.position })
    .from(teamMembers)
    .innerJoin(offices, eq(teamMembers.officeId, offices.id))
    .where(eq(offices.code, officeCode))
    .orderBy(asc(teamMembers.fullName));
}

const batchColumns = {
  id: testPrepBatches.id,
  courseId: testPrepBatches.courseId,
  courseName: testPrepCourses.name,
  courseSlug: testPrepCourses.slug,
  testType: testPrepCourses.testType,
  batchName: testPrepBatches.batchName,
  startDate: testPrepBatches.startDate,
  endDate: testPrepBatches.endDate,
  scheduleDays: testPrepBatches.scheduleDays,
  startTime: testPrepBatches.startTime,
  endTime: testPrepBatches.endTime,
  mode: testPrepBatches.mode,
  trainerId: testPrepBatches.trainerId,
  trainer: teamMembers.fullName,
  totalSeats: testPrepBatches.totalSeats,
  seatsTaken: testPrepBatches.seatsTaken,
  fee: testPrepBatches.fee,
  feeCurrency: testPrepCourses.feeCurrency,
  status: testPrepBatches.status,
  notes: testPrepBatches.notes,
  timezone: offices.timezone,
  officeId: testPrepCourses.officeId,
};

// Batches carry no office of their own, so the scope comes from the course they belong to.
export async function listAdminBatches(actor: Actor, f: BatchFilters) {
  const where = combine([
    scopedWhere(testPrepCourses, actor),
    f.q ? ilike(testPrepBatches.batchName, `%${f.q}%`) : undefined,
    f.course ? eq(testPrepBatches.courseId, f.course) : undefined,
    f.status ? eq(testPrepBatches.status, f.status as "open") : undefined,
    f.mode ? eq(testPrepBatches.mode, f.mode as "online") : undefined,
  ]);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select(batchColumns)
      .from(testPrepBatches)
      .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
      .leftJoin(teamMembers, eq(testPrepBatches.trainerId, teamMembers.id))
      .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
      .where(where)
      .orderBy(asc(testPrepCourses.name), desc(testPrepBatches.startDate))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(testPrepBatches)
      .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
      .where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminBatch(id: string) {
  const [row] = await db
    .select(batchColumns)
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .leftJoin(teamMembers, eq(testPrepBatches.trainerId, teamMembers.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id))
    .where(eq(testPrepBatches.id, id));
  return row;
}

// The office behind a batch, for the ownership check on the loaded row.
export async function courseOwner(courseId: string) {
  const [row] = await db
    .select({ id: testPrepCourses.id, officeId: testPrepCourses.officeId, name: testPrepCourses.name, slug: testPrepCourses.slug })
    .from(testPrepCourses)
    .where(eq(testPrepCourses.id, courseId));
  return row;
}

export async function batchOptions() {
  return db
    .select({
      id: testPrepBatches.id,
      batchName: testPrepBatches.batchName,
      courseName: testPrepCourses.name,
      startDate: testPrepBatches.startDate,
    })
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .orderBy(desc(testPrepBatches.startDate));
}

const registrationColumns = {
  id: testPrepRegistrations.id,
  fullName: testPrepRegistrations.fullName,
  email: testPrepRegistrations.email,
  phone: testPrepRegistrations.phone,
  notes: testPrepRegistrations.notes,
  status: testPrepRegistrations.status,
  createdAt: testPrepRegistrations.createdAt,
  sourcePage: testPrepRegistrations.sourcePage,
  batchId: testPrepRegistrations.batchId,
  batchName: testPrepBatches.batchName,
  startDate: testPrepBatches.startDate,
  courseName: testPrepCourses.name,
  timezone: offices.timezone,
};

function registrationWhere(actor: Actor, f: RegistrationFilters) {
  return combine([
    scopedWhere(testPrepCourses, actor),
    f.q
      ? or(
          ilike(testPrepRegistrations.fullName, `%${f.q}%`),
          ilike(testPrepRegistrations.email, `%${f.q}%`),
          ilike(testPrepRegistrations.phone, `%${f.q}%`),
        )
      : undefined,
    f.batch ? eq(testPrepRegistrations.batchId, f.batch) : undefined,
    f.status ? eq(testPrepRegistrations.status, f.status as "registered") : undefined,
    f.from ? gte(testPrepRegistrations.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(testPrepRegistrations.createdAt, new Date(`${f.to}T23:59:59Z`)) : undefined,
  ]);
}

const registrationFrom = () =>
  db
    .select(registrationColumns)
    .from(testPrepRegistrations)
    .innerJoin(testPrepBatches, eq(testPrepRegistrations.batchId, testPrepBatches.id))
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .leftJoin(offices, eq(testPrepCourses.officeId, offices.id));

export async function listRegistrations(actor: Actor, f: RegistrationFilters) {
  const where = registrationWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    registrationFrom()
      .where(where)
      .orderBy(desc(testPrepRegistrations.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(testPrepRegistrations)
      .innerJoin(testPrepBatches, eq(testPrepRegistrations.batchId, testPrepBatches.id))
      .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
      .where(where),
  ]);

  return { rows, total: total.n, page };
}

// Export runs the same filter as the list, so nobody can widen their reach through the download.
export async function exportTestPrepRegistrations(actor: Actor, f: RegistrationFilters) {
  return registrationFrom().where(registrationWhere(actor, f)).orderBy(desc(testPrepRegistrations.createdAt));
}

export async function registrationOwner(id: string) {
  const [row] = await db
    .select({
      id: testPrepRegistrations.id,
      officeId: testPrepCourses.officeId,
    })
    .from(testPrepRegistrations)
    .innerJoin(testPrepBatches, eq(testPrepRegistrations.batchId, testPrepBatches.id))
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .where(eq(testPrepRegistrations.id, id));
  return row;
}

export async function batchSeats(id: string) {
  const [row] = await db
    .select({
      id: testPrepBatches.id,
      totalSeats: testPrepBatches.totalSeats,
      seatsTaken: testPrepBatches.seatsTaken,
      status: testPrepBatches.status,
      officeId: testPrepCourses.officeId,
      courseSlug: testPrepCourses.slug,
    })
    .from(testPrepBatches)
    .innerJoin(testPrepCourses, eq(testPrepBatches.courseId, testPrepCourses.id))
    .where(eq(testPrepBatches.id, id));
  return row;
}
