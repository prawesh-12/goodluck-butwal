import { test, expect } from "vitest";
import { getFooterColumns } from "@/server/queries/site";

const hasDb = Boolean(process.env.DATABASE_URL);

test.runIf(hasDb)("the footer columns are the ones with links in them", async () => {
  const columns = await getFooterColumns();

  expect(columns.length).toBeGreaterThan(0);
  for (const column of columns) {
    expect(column.links.length).toBeGreaterThan(0);
  }
});

// footer.tagline and footer.copyright are single strings the footer prints itself, and the office
// list comes from the offices table. Reading them as column slugs put three empty headings in the
// grid and pushed the real columns onto a second row.
test.runIf(hasDb)("a footer string that is not a column does not become one", async () => {
  const titles = (await getFooterColumns()).map((column) => column.title.toLowerCase());

  expect(titles).not.toContain("tagline");
  expect(titles).not.toContain("copyright");
  expect(titles).not.toContain("offices");
});
