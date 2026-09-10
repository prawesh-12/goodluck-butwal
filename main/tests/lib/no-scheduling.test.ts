import { test, expect, describe } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { contentStatuses } from "@/lib/validators/fields";
import { contentStatus } from "@db/schema/enums";
import { createPostSchema } from "@/features/posts/validators";
import { createEventSchema } from "@/features/events/validators";
import { createInstitutionSchema } from "@/features/institutions/validators";
import { createCourseSchema } from "@/features/courses/validators";
import { createTestPrepCourseSchema } from "@/features/test-prep/validators";
import { createTeamMemberSchema } from "@/features/team/validators";
import { createPartnerSchema } from "@/features/partners/validators";

test("the only content statuses are draft, published and archived", () => {
  expect([...contentStatuses]).toEqual(["draft", "published", "archived"]);
  expect([...contentStatus.enumValues]).toEqual(["draft", "published", "archived"]);
});

const schemas = {
  posts: createPostSchema,
  events: createEventSchema,
  institutions: createInstitutionSchema,
  courses: createCourseSchema,
  "test-prep": createTestPrepCourseSchema,
  team: createTeamMemberSchema,
  partners: createPartnerSchema,
} as const;

describe.each(Object.entries(schemas))("%s", (_name, schema) => {
  test("rejects a scheduled status", () => {
    expect(schema.safeParse({ status: "scheduled" }).success).toBe(false);
  });

  test("has no go-live field", () => {
    const shape = "shape" in schema ? schema.shape : (schema as { _def: { schema: { shape: object } } })._def.schema.shape;
    expect(Object.keys(shape)).not.toContain("publishedAt");
    expect(Object.keys(shape)).not.toContain("goLiveAt");
  });
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

test("no scheduling code is left in the application", () => {
  const offenders = files("src").filter((path) => {
    const source = readFileSync(path, "utf8");
    // EventScheduled is schema.org's word for an event going ahead, nothing to do with publishing.
    return /\bscheduled\b|goLiveAt|checkSchedule|isDueToPublish|CRON_SECRET/i.test(
      source.replace(/EventScheduled/g, ""),
    );
  });
  expect(offenders).toEqual([]);
});

test("the cron endpoint and its helper are gone", () => {
  expect(existsSync("src/app/api/cron")).toBe(false);
  expect(existsSync("src/lib/utils/scheduled.ts")).toBe(false);
});

test("no cron is configured for it", () => {
  expect(JSON.parse(readFileSync("vercel.json", "utf8"))).not.toHaveProperty("crons");
  expect(readFileSync(".env.example", "utf8")).not.toContain("CRON_SECRET");
});

test("published_at survives as publication metadata", () => {
  const schema = readFileSync("src/db/schema/editorial.ts", "utf8");
  expect(schema).toContain("publishedAt");
  expect(readFileSync("src/app/sitemap.ts", "utf8")).toContain("updatedAt");
});
