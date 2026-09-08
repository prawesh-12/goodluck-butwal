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
