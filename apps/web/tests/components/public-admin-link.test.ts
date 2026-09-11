import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// "Login" sat beside Book a consultation in the header, where a visitor read it as a customer
// account the site does not have. Staff open /admin/login directly.
test.each(["src/components/layout/nav.tsx", "src/components/layout/footer.tsx"])("%s does not link to the admin", (path) => {
  expect(readFileSync(path, "utf8")).not.toMatch(/href="\/admin/);
});
