import { test, expect } from "vitest";
import { consultationSchema, enquirySchema } from "@/lib/validators/lead";
import { toPlainText } from "@/lib/email";
import { referenceCode } from "@/lib/request";

const enquiry = { fullName: "Sam", email: "SAM@Example.COM", message: "Help please" };

test("a minimal enquiry passes and the email is lowercased", () => {
  const result = enquirySchema.safeParse(enquiry);
  expect(result.success).toBe(true);
  expect(result.data?.email).toBe("sam@example.com");
});

test("an enquiry with no message is refused", () => {
  const result = enquirySchema.safeParse({ ...enquiry, message: "  " });
  expect(result.success).toBe(false);
});

test("a bad email is refused", () => {
  expect(enquirySchema.safeParse({ ...enquiry, email: "not-an-email" }).success).toBe(false);
});

test("phone numbers from either office are accepted", () => {
  for (const phone of ["+61 400 000 000", "071-560460", "(03) 9466 4783"]) {
    expect(enquirySchema.safeParse({ ...enquiry, phone }).success, phone).toBe(true);
  }
});

test("a phone field of letters is refused", () => {
  expect(enquirySchema.safeParse({ ...enquiry, phone: "call me" }).success).toBe(false);
});

test("an enquiry keeps the service slug it was sent", () => {
  const result = enquirySchema.safeParse({ ...enquiry, serviceSlug: "ielts-coaching" });
  expect(result.success).toBe(true);
  expect(result.data?.serviceSlug).toBe("ielts-coaching");
});

test("an enquiry with no service is accepted", () => {
  expect(enquirySchema.safeParse(enquiry).data?.serviceSlug).toBeUndefined();
  expect(enquirySchema.safeParse({ ...enquiry, serviceSlug: "" }).success).toBe(true);
});

test("a consultation needs an office, a service, a date and a time", () => {
  const full = {
    fullName: "Sam",
    email: "sam@example.com",
    officeCode: "au",
    serviceSlug: "ielts-coaching",
    preferredDate: "2026-10-15",
    preferredTime: "11:00",
  };
  expect(consultationSchema.safeParse(full).success).toBe(true);
  expect(consultationSchema.safeParse({ ...full, officeCode: "" }).success).toBe(false);
  expect(consultationSchema.safeParse({ ...full, preferredTime: "11am" }).success).toBe(false);
  expect(consultationSchema.safeParse({ ...full, preferredDate: "15/10/2026" }).success).toBe(false);
});

test("a reference code is readable down the phone", () => {
  const code = referenceCode("ENQ");
  expect(code).toMatch(/^ENQ-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  // No I, L, O or 0/1, which are the characters people mishear.
  expect(code).not.toMatch(/[ILO01]/);
});

test("the plain-text alternative keeps the words and drops the markup", () => {
  const text = toPlainText("<p>Your reference is <strong>ENQ-1234</strong>.</p><p>Thanks.</p>");
  expect(text).toBe("Your reference is ENQ-1234.\nThanks.");
});
