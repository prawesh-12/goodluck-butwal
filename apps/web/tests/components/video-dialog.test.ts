import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// Chrome answers "maybe" to canPlayType for HLS and then fails the load with MEDIA_ERR_SRC_NOT_SUPPORTED,
// so the dialog opened on an empty player. Nothing may pick the native path from canPlayType again.
test("the video dialog does not choose the native HLS path from canPlayType", () => {
  const src = readFileSync("src/components/ui/video-dialog.tsx", "utf8");
  expect(src).not.toMatch(/canPlayType\(/);
  expect(src).toMatch(/typeof MediaSource === "undefined"/);
});
