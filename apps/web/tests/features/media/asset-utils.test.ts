import { test, expect } from "vitest";
import { deleteBlock, fileSize, folderName, plainError } from "@/features/media/components/asset-utils";

test("names every thing still using the file", () => {
  const block = deleteBlock('Still in use by Team member "Fred Smith", News banner "Visa Guide". Remove it there first.', "image");
  expect(block.items).toEqual([
    { kind: "Team member", label: "Fred Smith" },
    { kind: "News banner", label: "Visa Guide" },
  ]);
  expect(block.more).toBe(0);
  expect(block.message).toBe("It is currently used by:");
});

test("keeps the count of the uses it was not told the names of", () => {
  const block = deleteBlock('Still in use by Team member "Fred", Partner logo "ABC", Event cover "Open Day" and 4 more. Remove it there first.', "image");
  expect(block.items).toHaveLength(3);
  expect(block.more).toBe(4);
});

test("turns a rich text refusal into a sentence about articles", () => {
  expect(deleteBlock("Still used inside 1 article body. Remove it there first.", "image").message).toBe(
    "It appears inside 1 news article. Take it out there first.",
  );
  expect(deleteBlock("Still used inside 3 article bodies. Remove it there first.", "image").message).toBe(
    "It appears inside 3 news articles. Take it out there first.",
  );
});

test("never repeats the repository wording back to the user", () => {
  const block = deleteBlock("/images/hero.jpg ships with the site. Remove it from the repository instead.", "video");
  expect(block.message).toBe("This video is part of the site design, so only a developer can change it.");
  expect(block.message).not.toContain("repository");
});

test("never names the file host", () => {
  expect(plainError("Cloudinary has no file at that address.", "image")).not.toContain("Cloudinary");
});

test("passes a message that is already plain through unchanged", () => {
  expect(plainError("That folder name is not allowed.", "image")).toBe("That folder name is not allowed.");
});

test("reads the folder out of the stored path", () => {
  expect(folderName("goodluck/team/fred")).toBe("team");
  expect(folderName("loose-file")).toBe("general");
});

test("rounds a size up to something readable", () => {
  expect(fileSize(2_411_724)).toBe("2.3 MB");
  expect(fileSize(48_000)).toBe("47 KB");
  expect(fileSize(120)).toBe("1 KB");
});
