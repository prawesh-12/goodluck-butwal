import { test, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const pathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));
// The anchor does not carry the prefetch prop, so the stub writes it out to be read back.
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children?: React.ReactNode }) =>
    createElement("a", { href, "data-prefetch": String(prefetch), ...rest }, children),
}));

const { Nav } = await import("@/components/layout/nav");
const text = { bookCta: "Book", menuOpen: "Open", menuClose: "Close" };
const logo = (path: string) => {
  pathname.mockReturnValue(path);
  return renderToStaticMarkup(createElement(Nav, { text })).match(/<a href="\/" data-prefetch="([^"]*)"/)?.[1];
};

// On the home page the logo linked to the page already showing, which prefetched it again on
// every visit. Inner pages keep the default so hovering the logo still warms the home route.
test("the nav logo does not prefetch the home page while on it", () => {
  expect(logo("/")).toBe("false");
});

test("the nav logo keeps the default prefetch on inner pages", () => {
  expect(logo("/services")).toBe("undefined");
});
