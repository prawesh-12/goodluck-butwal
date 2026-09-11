import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// "Login" sat beside Book a consultation in the header, where a visitor read it as a customer
// account the site does not have. The one way into the admin from the public site is a quiet
// link in the last line of the footer.
test("the site header does not link to the admin", () => {
  const nav = readFileSync("src/components/layout/nav.tsx", "utf8");
  expect(nav).not.toMatch(/href="\/admin/);
});

test("the footer carries the staff login link", () => {
  const footer = readFileSync("src/components/layout/footer.tsx", "utf8");
  expect(footer).toContain('href="/admin/login"');
});
