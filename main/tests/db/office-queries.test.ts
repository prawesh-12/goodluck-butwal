import { test, expect } from "vitest";
import { whatsappLink } from "@/server/queries/offices";

test("the plus and the spacing come out of the stored number", () => {
  expect(whatsappLink("+61 3 9466 4783")).toBe("https://wa.me/61394664783");
  expect(whatsappLink("+9779801234567")).toBe("https://wa.me/9779801234567");
});

test("an office with no whatsapp number gets no link", () => {
  expect(whatsappLink(null)).toBeUndefined();
  expect(whatsappLink("")).toBeUndefined();
});
