import { notFound } from "next/navigation";

// Catches unmatched URLs so the styled 404 renders with the nav and footer, not Next's own.
export default function UnmatchedPage() {
  notFound();
}
