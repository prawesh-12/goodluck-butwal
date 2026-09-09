// Kept out of the Zod schemas: a client component importing a validator drags zod into the
// browser bundle.

export const EXCERPT_MAX = 200;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const tones = ["blue", "dark", "surface", "white"] as const;
export type Tone = (typeof tones)[number];

export const testimonialTypes = ["text", "image", "video"] as const;
export type TestimonialType = (typeof testimonialTypes)[number];

export const videoProviders = ["youtube", "vimeo", "local"] as const;

export const CONSENT_REQUIRED = "Record consent before publishing.";

export const pagePath = (parent: string, slug: string) =>
  slug === "about" ? "/about" : `/${parent}/${slug}`;

export const destinationPath = (slug: string) => `/study-abroad/${slug}`;

export const servicePath = (slug: string) => `/services/${slug}`;

export type RequiredField = "quote" | "imageId" | "videoUrl" | "videoProvider";
export type Requirement = { field: RequiredField; label: string; message: string };

// One list, read by the form, the schema and the publish check.
export function requiredFieldsFor(type: TestimonialType): Requirement[] {
  if (type === "text") {
    return [{ field: "quote", label: "Quote", message: "A written testimonial needs the quote." }];
  }
  if (type === "image") {
    return [{ field: "imageId", label: "Image", message: "An image testimonial needs the image." }];
  }
  return [
    { field: "videoUrl", label: "Video link", message: "A video testimonial needs the video link." },
    {
      field: "videoProvider",
      label: "Video provider",
      message: "Say whether the video is on YouTube, Vimeo or hosted here.",
    },
  ];
}

export type SocialLink = { label: string; href: string; icon?: string };

export type SettingsValues = {
  site_name: string;
  hero_image_id: string;
  hero_video_id: string;
  default_seo_title: string;
  default_seo_description: string;
  default_og_image_id: string;
  social_links: SocialLink[];
  notify_email_au: string;
  notify_email_np: string;
  ga4_id: string;
  gtm_id: string;
  google_site_verification: string;
  announcement_bar: string;
  google_rating: string;
  google_review_count: number;
};

export const eventTypes = [
  "seminar",
  "education_fair",
  "webinar",
  "workshop",
  "info_session",
] as const;
export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  seminar: "Seminar",
  education_fair: "Education fair",
  webinar: "Webinar",
  workshop: "Workshop",
  info_session: "Info session",
};
