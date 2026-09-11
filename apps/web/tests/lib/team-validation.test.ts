import { test, expect } from "vitest";
import {
  createTeamMemberSchema,
  teamPublishProblems,
  updateTeamMemberSchema,
} from "@/features/team/validators";

const office = "11111111-1111-4111-8111-111111111111";
const photo = "22222222-2222-4222-8222-222222222222";

const member = {
  officeId: office,
  fullName: "Sam Rai",
  position: "Migration Agent",
  photoId: photo,
  status: "published" as const,
};

test("qualifications and expertise come back as the list that went in", () => {
  const parsed = createTeamMemberSchema.parse({
    ...member,
    qualifications: ["MARA 1234567", "MBA"],
    expertise: ["Student visas"],
  });
  expect(parsed.qualifications).toEqual(["MARA 1234567", "MBA"]);
  expect(parsed.expertise).toEqual(["Student visas"]);
});

test("blank and padded tags are dropped", () => {
  const parsed = createTeamMemberSchema.parse({
    ...member,
    qualifications: ["  MARA 1234567  ", "", "   "],
  });
  expect(parsed.qualifications).toEqual(["MARA 1234567"]);
});

test("a member with no tags at all is fine", () => {
  expect(createTeamMemberSchema.parse(member).qualifications).toEqual([]);
});

test("a slug with spaces is refused", () => {
  expect(createTeamMemberSchema.safeParse({ ...member, slug: "Sam Rai" }).success).toBe(false);
});

test("a LinkedIn address that is not https is refused", () => {
  expect(createTeamMemberSchema.safeParse({ ...member, linkedinUrl: "linkedin.com/in/sam" }).success).toBe(false);
});

test("an update needs an id", () => {
  expect(updateTeamMemberSchema.safeParse(member).success).toBe(false);
});

test("a complete member has nothing blocking publication", () => {
  const parsed = createTeamMemberSchema.parse(member);
  expect(teamPublishProblems(parsed, { photo: "Sam Rai" })).toEqual([]);
});

test("publishing names every missing field", () => {
  const parsed = createTeamMemberSchema.parse({
    fullName: "Sam Rai",
    officeId: "",
    status: "published" as const,
  });
  expect(teamPublishProblems(parsed, {})).toEqual(["Position", "Office", "Photo"]);
});

test("a photo with no alt text blocks publication", () => {
  const parsed = createTeamMemberSchema.parse(member);
  expect(teamPublishProblems(parsed, { photo: null })).toEqual(["Alt text on the photo"]);
});
