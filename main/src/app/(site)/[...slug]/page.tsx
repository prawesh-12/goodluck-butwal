import { notFound } from "next/navigation";

// Admin has its own root layout now, so an unmatched URL no longer resolves inside the site
// group and Next answers with its built-in 404. This catches it so the styled page still shows
// with the nav and footer.
export default function UnmatchedPage() {
  notFound();
}
