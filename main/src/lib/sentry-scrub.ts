// Every field the plan names as personal. An error report that carries a student's email or the
// text of their enquiry is a privacy problem, not a debugging aid.
export const PII_FIELDS = ["email", "phone", "full_name", "fullName", "message", "notes"];

const REDACTED = "[redacted]";

// Walks anything Sentry is about to send and replaces the values of those fields. Depth is
// capped because an event can hold a cyclic or very deep object and this runs on every error.
export function scrub<T>(value: T, depth = 0): T {
  if (depth > 8 || value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => scrub(item, depth + 1)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = PII_FIELDS.includes(key) && item !== undefined && item !== null
      ? REDACTED
      : scrub(item, depth + 1);
  }
  return out as T;
}

// An email can also arrive inside a message string rather than a named field.
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export function scrubText(text: string) {
  return text.replace(EMAIL, REDACTED);
}
