import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/admin/consultations",
  useSearchParams: () => new URLSearchParams(),
}));

const { LeadFilters } = await import("@/features/leads/components/lead-filters");

// The date inputs sat on their own line under the search box. They belong in the same row.
test("the date range renders inside the filter bar row", () => {
  const html = renderToStaticMarkup(
    <LeadFilters searchPlaceholder="Search" fromLabel="From" toLabel="To" filters={[{ name: "status", label: "Status", options: [] }]} />,
  );

  const row = html.indexOf("flex-wrap");
  const search = html.indexOf('type="search"');
  const from = html.indexOf('id="lead-from"');
  const to = html.indexOf('id="lead-to"');

  expect(row).toBeGreaterThan(-1);
  expect(search).toBeGreaterThan(row);
  expect(from).toBeGreaterThan(search);
  expect(to).toBeGreaterThan(from);
  expect(html.indexOf("flex-wrap", row + 1)).toBe(-1);
});
