import { test, expect } from "vitest";
import {
  createBatchSchema,
  registerSchema,
  testPrepPublishProblems,
} from "@/lib/validators/test-prep";

const batch = {
  courseId: "11111111-1111-4111-8111-111111111111",
  batchName: "Morning batch",
  startDate: "2026-03-02",
  endDate: "2026-05-02",
  scheduleDays: [1, 3, 5],
  startTime: "07:00",
  endTime: "09:00",
  mode: "in_person",
  trainerId: null,
  totalSeats: 20,
  seatsTaken: 4,
  fee: "",
  status: "open",
  notes: "",
};

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message).join(" | ") ?? "";

test("a batch with the usual fields is accepted", () => {
  expect(createBatchSchema.safeParse(batch).success).toBe(true);
});

test("seats taken above the total seats is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, totalSeats: 10, seatsTaken: 11 });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("More seats are taken than the batch has");
});

test("seats taken equal to the total seats is allowed", () => {
  expect(createBatchSchema.safeParse({ ...batch, totalSeats: 10, seatsTaken: 10 }).success).toBe(true);
});

test("a schedule day above six is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, scheduleDays: [1, 7] });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("A day is 0 to 6");
});

test("a negative schedule day is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, scheduleDays: [-1] });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("A day is 0 to 6");
});

test("sunday and saturday are both allowed", () => {
  expect(createBatchSchema.safeParse({ ...batch, scheduleDays: [0, 6] }).success).toBe(true);
});

test("an end time before the start time is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, startTime: "09:00", endTime: "07:00" });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("cannot end before it starts");
});

test("an end time equal to the start time is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, startTime: "09:00", endTime: "09:00" });
  expect(result.success).toBe(false);
});

test("a batch with no times set is accepted", () => {
  expect(createBatchSchema.safeParse({ ...batch, startTime: "", endTime: "" }).success).toBe(true);
});

test("a time coming back from postgres as HH:MM:SS is kept", () => {
  const result = createBatchSchema.safeParse({ ...batch, startTime: "07:00:00", endTime: "09:00:00" });
  expect(result.success).toBe(true);
  expect(result.data?.startTime).toBe("07:00");
});

test("an end date before the start date is refused", () => {
  const result = createBatchSchema.safeParse({ ...batch, startDate: "2026-03-02", endDate: "2026-03-01" });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("The batch cannot end before it starts");
});

test("a batch needs at least one seat", () => {
  const result = createBatchSchema.safeParse({ ...batch, totalSeats: 0, seatsTaken: 0 });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("at least one seat");
});

test("publish validation names every missing field", () => {
  const problems = testPrepPublishProblems({ name: "", summary: "", descriptionHtml: "", syllabus: [] });
  expect(problems).toEqual([
    "Name is empty.",
    "The one-line summary is empty.",
    "The course description is empty.",
    "There is nothing in the syllabus.",
  ]);
});

test("publish validation names only what is missing", () => {
  const problems = testPrepPublishProblems({
    name: "IELTS",
    summary: "A short line.",
    descriptionHtml: "<p>Words.</p>",
    syllabus: [],
  });
  expect(problems).toEqual(["There is nothing in the syllabus."]);
});

test("a complete course has nothing blocking publication", () => {
  const problems = testPrepPublishProblems({
    name: "IELTS",
    summary: "A short line.",
    descriptionHtml: "<p>Words.</p>",
    syllabus: [{ title: "Listening", body: "Four sections." }],
  });
  expect(problems).toEqual([]);
});

test("a registration without a name is refused", () => {
  const result = registerSchema.safeParse({
    batchId: batch.courseId,
    fullName: "",
    email: "someone@example.com",
  });
  expect(result.success).toBe(false);
  expect(messages(result)).toContain("Tell us your name");
});

test("a registration email is lowercased", () => {
  const result = registerSchema.safeParse({
    batchId: batch.courseId,
    fullName: "A Person",
    email: "Someone@Example.COM",
  });
  expect(result.data?.email).toBe("someone@example.com");
});
