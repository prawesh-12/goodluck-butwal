import { test, expect } from "vitest";
import { sanitize } from "@/lib/sanitize";

test("keeps the markup the editor is allowed to produce", () => {
  const html = "<h2>Visas</h2><p>Read the <a href=\"https://example.com\">guide</a>.</p>";
  expect(sanitize(html)).toBe(html);
});

test("strips a script tag and its contents", () => {
  expect(sanitize("<p>Hi</p><script>alert(1)</script>")).toBe("<p>Hi</p>");
});

test("strips an inline event handler", () => {
  expect(sanitize('<img src="/a.png" onerror="alert(1)" alt="a">')).not.toContain("onerror");
});

test("strips a javascript: href", () => {
  expect(sanitize('<a href="javascript:alert(1)">click</a>')).not.toContain("javascript:");
});

test("drops tags the article styles do not cover", () => {
  expect(sanitize("<iframe src=\"https://evil.test\"></iframe><p>ok</p>")).toBe("<p>ok</p>");
});

test("adds noopener to a link that opens a new tab", () => {
  const out = sanitize('<a href="https://example.com" target="_blank">go</a>');
  expect(out).toContain('rel="noopener noreferrer"');
});

test("the tag list is exactly the one the plan names", () => {
  const allowed = "p h2 h3 h4 ul ol li strong em a blockquote br hr table thead tbody tr th td img figure figcaption".split(" ");
  for (const tag of allowed) {
    const html = `<${tag}>x</${tag}>`;
    expect(sanitize(html), tag).toContain(`<${tag}`);
  }
});

test("h1 is never allowed inside a body", () => {
  expect(sanitize("<h1>Title</h1>")).not.toContain("<h1");
});

test("tags the plan does not list are dropped", () => {
  for (const tag of ["u", "s", "code", "pre", "script", "iframe"]) {
    expect(sanitize(`<${tag}>x</${tag}>`), tag).not.toContain(`<${tag}`);
  }
});
