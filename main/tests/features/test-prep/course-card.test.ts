import { test, expect } from "vitest";
import { batchCount } from "@/features/test-prep/components/course-card";

test("a course running one batch is not called 1 batches", () => {
  expect(batchCount(1)).toBe("1 batch");
});

test("a course running several batches counts them", () => {
  expect(batchCount(4)).toBe("4 batches");
});

test("a course with nothing scheduled says so", () => {
  expect(batchCount(0)).toBe("No batches yet");
});
