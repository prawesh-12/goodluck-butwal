import { db } from "@goodluck/db";
import { pages } from "@goodluck/db/schema";
import { about } from "./source/about";

// One row per About route. The shape of `blocks` is fixed per slug, and the admin edits it
// through a repeater form rather than a raw JSON box.
export async function seedPages() {
  const rows = [
    {
      slug: "about",
      title: "About us",
      intro: about.established,
      blocks: {
        established: about.established,
        mission: about.mission,
        vision: about.vision,
        values: [{ title: "Our values", body: about.values }],
        ethics: about.ethics,
        quote: { text: about.founderQuote, author: about.founders },
      },
    },
    {
      slug: "message-from-co-founders",
      title: "Message from the co-founders",
      intro: about.coFounderSummary[0],
      blocks: {
        message_html: about.coFounderMessage.map((p) => `<p>${p}</p>`).join(""),
        summary: about.coFounderSummary[0],
        photo_id: null,
      },
    },
    {
      slug: "corporate-social-responsibility",
      title: "Corporate social responsibility",
      intro: about.csrIntro,
      blocks: {
        partners: about.csr.map((c) => ({ name: c.name, line: c.line })),
      },
    },
    {
      slug: "careers",
      title: "Careers",
      intro: null,
      blocks: {
        values: about.careersValues.map((v) => ({ title: v.title, body: v.line })),
        voices: about.staffVoices.map((v) => ({
          quote: v.quote,
          name: v.name,
          role: v.role,
          photo_id: null,
        })),
        apply_email: null,
      },
    },
    {
      // The registered particulars a regulator wants are not in this repo. The row ships with no
      // body so the page shows only what is already verified, and the admin fills in the rest.
      slug: "company-profile",
      title: "Company profile",
      intro: null,
      blocks: null,
    },
  ];

  for (const [index, row] of rows.entries()) {
    const values = {
      ...row,
      parent: "about",
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
      showInNav: true,
    };
    await db
      .insert(pages)
      .values(values)
      .onConflictDoUpdate({ target: pages.slug, set: { ...values, updatedAt: new Date() } });
  }
  return rows.length;
}
