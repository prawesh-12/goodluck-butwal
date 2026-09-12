import { test, expect } from "vitest";
import { getCompanyProfile } from "@/features/pages/queries";

const hasDb = Boolean(process.env.DATABASE_URL);

// The registered particulars come off this row, so /company-profile prints blanks without it.
test.runIf(hasDb)("the company profile row carries its registered particulars", async () => {
  const profile = await getCompanyProfile();
  expect(profile?.registration_no).toBeTruthy();
  expect(profile?.strategies.length).toBeGreaterThan(0);
});
