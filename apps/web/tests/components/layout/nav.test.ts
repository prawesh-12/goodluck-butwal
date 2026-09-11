import { test, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const pathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({ usePathname: () => pathname(), useRouter: () => ({ prefetch: () => {} }) }));
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

// Dropping the two lightest layers must not move the remaining bands: the first kept layer still
// starts its mask at 12.5% and the stack still ends with the 10 px layer at the top of the strip.
test("the blur stack keeps six layers with their original mask bands", () => {
  pathname.mockReturnValue("/services");
  const html = renderToStaticMarkup(createElement(Nav, { text }));
  const blurs = [...html.matchAll(/;backdrop-filter:blur\(([\d.]+)px\)/g)].map((m) => Number(m[1]));
  expect(blurs).toEqual([0.3125, 0.625, 1.25, 2.5, 5, 10]);
  expect(html).toContain("rgba(0,0,0,0) 12.5%, #000 25%, #000 37.5%, rgba(0,0,0,0) 50%");
  expect(html).toContain("rgba(0,0,0,0) 87.5%, #000 100%, #000 100%");
});

// Each backdrop layer only shows through a band of its mask. Clipping it to that band plus four
// standard deviations of its blur keeps every visible pixel and skips blurring the rest of the strip.
test("each blur layer is clipped to its mask band plus the blur's reach", () => {
  pathname.mockReturnValue("/services");
  const clips = [...renderToStaticMarkup(createElement(Nav, { text })).matchAll(/clip-path:inset\(((?:[^()]|\([^()]*\))*)\)/g)].map((m) => m[1]);
  expect(clips).toHaveLength(6);
  expect(clips[0]).toBe("calc(50% - 1.25px) 0 calc(12.5% - 1.25px) 0");
  expect(clips[2]).toBe("calc(25% - 5px) 0 calc(37.5% - 5px) 0");
  expect(clips[5]).toBe("0 0 calc(87.5% - 40px) 0");
});
