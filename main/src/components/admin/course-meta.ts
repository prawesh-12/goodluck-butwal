// Constants the institution and course forms need in the browser. Kept out of the Zod schemas
// on purpose: a client component that imports a validator drags the whole zod runtime into the
// browser bundle.

export const qualificationLevels = [
  "foundation",
  "english_language",
  "certificate",
  "diploma",
  "advanced_diploma",
  "bachelor",
  "graduate_certificate",
  "graduate_diploma",
  "master",
  "doctorate",
] as const;

export type QualificationLevel = (typeof qualificationLevels)[number];

export const QUALIFICATION_LABEL: Record<QualificationLevel, string> = {
  foundation: "Foundation",
  english_language: "English language",
  certificate: "Certificate",
  advanced_diploma: "Advanced diploma",
  diploma: "Diploma",
  bachelor: "Bachelor",
  graduate_certificate: "Graduate certificate",
  graduate_diploma: "Graduate diploma",
  master: "Master",
  doctorate: "Doctorate",
};

export const INTAKE_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const institutionPath = (slug: string) => `/institutions/${slug}`;
export const coursePath = (slug: string) => `/courses/${slug}`;
