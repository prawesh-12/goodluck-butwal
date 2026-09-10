import { test, expect, vi } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@db/client", () => ({ db: {} }));

const { folderOf } = await import("@/features/media/queries");

const queries = readFileSync("src/features/media/queries.ts", "utf8");

// A delete that misses a column silently breaks a published page, so the two lists must not drift.
test("every schema column pointing at media_assets is covered by the delete check", () => {
  const dir = "src/db/schema";
  const columns = readdirSync(dir)
    .flatMap((name) => [...readFileSync(join(dir, name), "utf8").matchAll(/(\w+):\s*uuid\("(\w+)"\)[\s\S]{0,80}?references\(\(\):?\s*\w*\s*=>\s*mediaAssets\.id\)/g)])
    .map((match) => match[1]);

  expect(columns.length).toBeGreaterThan(5);
  for (const column of columns) {
    expect(queries, `${column} has no entry in the delete reference check`).toContain(`.${column},`);
  }
});

test("the library lists from cloudinary, not from a table scan", () => {
  const listLibrary = queries.slice(queries.indexOf("export async function listLibrary"));
  expect(listLibrary).toContain("searchAssets(");
});

test("rich text is searched by public id, because that is what an embedded url carries", () => {
  const findInRichText = queries.slice(queries.indexOf("export async function findInRichText"));
  expect(findInRichText).toContain("publicId");
  expect(findInRichText).not.toContain("staticPath");
});

test("a folder is read off the public id, not looked up", () => {
  expect(folderOf("goodluck/team/jane")).toBe("team");
  expect(folderOf("goodluck/news/visa-changes")).toBe("news");
  expect(folderOf("loose-file")).toBe("general");
});

test("an uploaded video is given the adaptive ladder, so no viewer pulls the origin file", () => {
  const cloudinary = readFileSync("src/lib/integrations/cloudinary.ts", "utf8");
  const ticket = cloudinary.slice(cloudinary.indexOf("export async function uploadTicket"));
  expect(ticket).toContain('eager: "sp_auto"');
});

// A video larger than the platform's request body limit must not be relayed through a route.
test("no route accepts an uploaded file body", () => {
  expect(existsSync("src/app/api/admin/media/upload")).toBe(false);
  const sign = readFileSync("src/app/api/admin/media/sign/route.ts", "utf8");
  expect(sign).not.toContain("formData");
  expect(sign).toContain("uploadTicket");
});

test("the browser posts the file to cloudinary itself", () => {
  const client = readFileSync("src/features/media/components/upload-dialog.tsx", "utf8");
  expect(client).toContain("ticket.endpoint");
  expect(client).toContain("recordUpload");
});

// The browser is the party reporting the upload, so its numbers are not the ones written down.
test("a recorded upload is measured from cloudinary, not from the browser", () => {
  const actions = readFileSync("src/features/media/actions.ts", "utf8");
  const record = actions.slice(actions.indexOf("export async function recordUpload"));
  expect(record).toContain("getAsset(");
  expect(record.slice(0, record.indexOf("const columns"))).toContain("requirePermission");
});

test("the page may reach cloudinary's upload endpoint", () => {
  expect(readFileSync("next.config.ts", "utf8")).toContain("https://api.cloudinary.com");
});

test("cloudinary credentials never leave the server", () => {
  const client = readFileSync("src/features/media/components/asset-library.tsx", "utf8");
  expect(client).toContain('"use client"');
  expect(client).not.toContain("@/lib/integrations/cloudinary");
  expect(client).not.toContain("CLOUDINARY_API");
});
