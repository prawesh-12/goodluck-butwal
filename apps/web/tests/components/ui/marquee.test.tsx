import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Marquee } from "@/components/ui/marquee";

const track = (html: string) => html.match(/<div style="--repeat:[^"]*" class="([^"]*)">/)?.[1] ?? "";

test("one animated track carries all the copies", () => {
  const html = renderToStaticMarkup(<Marquee><span>tile</span></Marquee>);
  expect(html.match(/animate-marquee/g)).toHaveLength(1);
  expect(html.match(/>tile</g)).toHaveLength(4);
  expect(html).toContain('style="--repeat:4"');
});

test("repeat sets the copy count and the css variable together", () => {
  const html = renderToStaticMarkup(<Marquee repeat={2}><span>tile</span></Marquee>);
  expect(html.match(/>tile</g)).toHaveLength(2);
  expect(html).toContain('style="--repeat:2"');
});

test("reverse and pauseOnHover apply to the track", () => {
  const cls = track(renderToStaticMarkup(<Marquee reverse pauseOnHover><span>tile</span></Marquee>));
  expect(cls).toContain("[animation-direction:reverse]");
  expect(cls).toContain("group-hover:[animation-play-state:paused]");
});

test("the keyframes move the track by one copy plus one gap", () => {
  const css = readFileSync("src/styles/globals.css", "utf8");
  expect(css).toMatch(/@keyframes marquee \{.*translateX\(calc\(\(-100% - var\(--gap\)\) \/ var\(--repeat\)\)\)/);
  expect(css).toMatch(/@keyframes marquee-vertical \{.*translateY\(calc\(\(-100% - var\(--gap\)\) \/ var\(--repeat\)\)\)/);
});
