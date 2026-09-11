import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// The anchor does not carry the prefetch prop, so the stub writes it out to be read back.
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children }: { href: string; prefetch?: boolean | null; children?: React.ReactNode }) => (
    <a href={href} data-prefetch={String(prefetch)}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ prefetch: () => {} }) }));

const { Link, SlowConnectionProvider, slowConnection } = await import("@/components/ui/link");

test("a data-saver or 2g/3g connection counts as slow, anything else does not", () => {
  expect(slowConnection({ saveData: true, effectiveType: "4g" })).toBe(true);
  expect(slowConnection({ effectiveType: "3g" })).toBe(true);
  expect(slowConnection({ effectiveType: "2g" })).toBe(true);
  expect(slowConnection({ effectiveType: "slow-2g" })).toBe(true);
  expect(slowConnection({ effectiveType: "4g" })).toBe(false);
  expect(slowConnection(undefined)).toBe(false);
});

test("the server render keeps the default prefetch so hydration matches", () => {
  const html = renderToStaticMarkup(
    <SlowConnectionProvider>
      <Link href="/services">Services</Link>
    </SlowConnectionProvider>,
  );
  expect(html).toContain('data-prefetch="undefined"');
});

test("an explicit prefetch value passes through", () => {
  expect(renderToStaticMarkup(<Link href="/" prefetch={false}>Home</Link>)).toContain('data-prefetch="false"');
});
