import { test, expect, vi, afterEach } from "vitest";

async function imageCacheControl(nodeEnv: string) {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.resetModules();
  const config = (await import("../../next.config")).default;
  const rules = await config.headers!();
  const images = rules.find((rule) => rule.source === "/images/:path*")!;
  return images.headers.find((h) => h.key === "Cache-Control")!.value;
}

afterEach(() => vi.unstubAllEnvs());

// Files under /images keep their names when they are replaced, so an immutable header served the
// bytes a visitor already had for a year and hid every replacement. It must revalidate instead.
test("images are never served as immutable", async () => {
  const value = await imageCacheControl("production");

  expect(value).not.toContain("immutable");
  expect(value).toContain("must-revalidate");
});
