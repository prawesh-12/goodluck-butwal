import { test, expect } from "vitest";
import {
  createTestimonialSchema,
  missingForType,
  publicIdentity,
  requiredFieldsFor,
  testimonialPublishProblems,
  type TestimonialInput,
} from "@/features/testimonials/validators";

const written: TestimonialInput = {
  type: "text",
  authorName: "Ramesh Shrestha",
  displayName: "Ramesh S.",
  isAnonymised: false,
  authorPhotoId: "",
  authorLocation: "Kathmandu",
  quote: "They answered every question the same day.",
  bodyHtml: "",
  imageId: "",
  videoUrl: "",
  videoProvider: "",
  destinationId: "",
  institutionId: "",
  serviceId: "",
  officeId: "",
  rating: 5,
  isFeatured: false,
  status: "published",
  publishedAt: "",
};

test("a written testimonial needs the quote", () => {
  expect(requiredFieldsFor("text").map((need) => need.field)).toEqual(["quote"]);
});

test("an image testimonial needs the image", () => {
  expect(requiredFieldsFor("image").map((need) => need.field)).toEqual(["imageId"]);
});

test("a video testimonial needs the link and the provider", () => {
  expect(requiredFieldsFor("video").map((need) => need.field)).toEqual([
    "videoUrl",
    "videoProvider",
  ]);
});

test("changing the kind changes what is missing", () => {
  const asVideo = { ...written, type: "video" as const };
  expect(missingForType(asVideo).map((need) => need.field)).toEqual([
    "videoUrl",
    "videoProvider",
  ]);
  expect(missingForType(written)).toEqual([]);
});

test("a video with a link but no provider is refused", () => {
  const result = createTestimonialSchema.safeParse({
    ...written,
    type: "video",
    quote: "",
    videoUrl: "https://youtu.be/abc123",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].path).toEqual(["videoProvider"]);
});

test("a written story with a name and a quote can be published", () => {
  expect(testimonialPublishProblems(written, {})).toEqual([]);
});

test("an image story cannot be published while its image has no alt text", () => {
  const story = {
    ...written,
    type: "image" as const,
    quote: "",
    imageId: "33333333-3333-4333-8333-333333333333",
  };
  expect(testimonialPublishProblems(story, { image: null })).toEqual(["Add alt text to the image."]);
});

test("an anonymised story shows the chosen name, never the real one, and drops the photo", () => {
  const shown = publicIdentity({
    isAnonymised: true,
    authorName: "Ramesh Shrestha",
    displayName: "A student from Nepal",
    authorPhotoId: "44444444-4444-4444-8444-444444444444",
  });
  expect(shown.displayName).toBe("A student from Nepal");
  expect(shown.authorPhotoId).toBe(null);
});

test("a named story falls back to the real name when no display name is given", () => {
  const shown = publicIdentity({
    isAnonymised: false,
    authorName: "Ramesh Shrestha",
    displayName: "",
    authorPhotoId: "",
  });
  expect(shown.displayName).toBe("Ramesh Shrestha");
});

test("an anonymised story cannot reuse the real name as the shown name", () => {
  const result = createTestimonialSchema.safeParse({
    ...written,
    isAnonymised: true,
    displayName: "Ramesh Shrestha",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].path).toEqual(["displayName"]);
});

test("an anonymised story with no shown name is refused", () => {
  const result = createTestimonialSchema.safeParse({
    ...written,
    isAnonymised: true,
    displayName: "",
  });
  expect(result.success).toBe(false);
});
