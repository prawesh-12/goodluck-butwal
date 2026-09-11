import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// The sidebar logo block and the topbar meet at the top left corner. They were sized by their
// own padding and landed three pixels apart, so the separator under the logo and the topbar
// border drew two offset lines. Both are now a fixed height and have to stay the same one.
test("the sidebar logo block and the topbar are the same height", () => {
  const sidebar = readFileSync("src/components/layout/admin/sidebar.tsx", "utf8");
  const topbar = readFileSync("src/components/layout/admin/topbar.tsx", "utf8");

  // The block that holds the logo, and the row that holds the account menu.
  const logoBlock = /className="([^"]*)"(?=[\s\S]{0,200}?\/brand\/logo\.png)/.exec(sidebar)?.[1];
  const topbarRow = /className="([^"]*max-w-\[1400px\][^"]*)"/.exec(topbar)?.[1];

  expect(logoBlock, "no logo block in the sidebar").toBeDefined();
  expect(topbarRow, "no topbar row").toBeDefined();

  expect(logoBlock).toContain("h-16");
  expect(topbarRow).toContain("h-16");
});
