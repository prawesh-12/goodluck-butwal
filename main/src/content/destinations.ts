// Australia and the United Kingdom: the destination pages goodluck_main publishes (Canada was dropped from the site).
export type Destination = {
  slug: string;
  name: string;
  flag: string;
  card: string;
  hero: string;
  heroAlt: string;
  overview: string;
  highlights: { title: string; line: string }[];
  academic: string;
  work: string;
  migrationTitle: string;
  migration: { title: string; line: string }[];
  whyTitle: string;
  why: string[];
  costs?: { title: string; line: string }[];
  checklistTitle?: string;
  checklist?: string[];
  help: { title: string; line: string }[];
};

export const helpWeProvide = ["Document check", "Application process", "Visa application", "Follow-up with embassy", "Language coaching"];

export const destinations: Destination[] = [
  {
    slug: "australia",
    name: "Australia",
    flag: "/images/flags/australia.svg",
    card: "/images/destinations/australia-card-v2.webp",
    hero: "/images/destinations/australia-hero.webp",
    heroAlt: "Student working on a wind power project with a clipboard",
    overview: "Australian universities are among the most well-known and qualified in the world.",
    highlights: [
      { title: "Global recognition", line: "Graduates are sought after thanks to a well-regulated, high-quality education system." },
      { title: "Work", line: "International students can work up to 20 hours per week." },
      { title: "Technology", line: "An emphasis on research and technology attracts international students." },
    ],
    academic:
      "Secondary and higher school levels start in January or February. VET admissions open from late February or early March, with additional college intakes in July, September and October.",
    work: "A student visa permits work of up to 40 hours every two weeks, in sectors such as hospitality, service and retail.",
    migrationTitle: "Migration visa in Australia",
    migration: [
      { title: "Accommodation", line: "Options depend on budget for study, rent and jobs." },
      { title: "Work rights", line: "Up to 40 hours every two weeks on a student visa." },
      { title: "Stay after graduation", line: "Australia allows international students to stay up to 4 years after graduation." },
    ],
    whyTitle: "Why choose Australia",
    why: [
      "Global recognition of Australian graduates.",
      "A best and growing destination for students all over the world.",
      "Affordable living expenses.",
      "More than 22,000 courses are available.",
      "Students can work up to 40 hours fortnightly.",
      "Australia allows international students to stay up to 4 years after their graduation.",
    ],
    checklistTitle: "Before applying for a student visa",
    checklist: [
      "Past education qualification with IELTS/PTE scores",
      "Statement of purpose for choosing an Australian university",
      "Asset valuation",
      "Reply to the institution once the offer letter is received",
      "Confirmation of Enrolment (COE)",
      "Overseas Student Health Cover (OSHC)",
    ],
    help: [
      { title: "Free consultation", line: "Get professional counselling." },
      { title: "Visa guidance", line: "Complete visa guidance for Australia." },
      { title: "Coaching classes", line: "IELTS preparation with our live classes." },
    ],
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    flag: "/images/flags/united-kingdom.svg",
    card: "/images/destinations/united-kingdom-card-v2.webp",
    hero: "/images/destinations/united-kingdom-hero.webp",
    heroAlt: "Student preparing for exams at a desk full of books",
    overview: "The UK has some of the finest universities in the world.",
    highlights: [
      { title: "High standards", line: "Universities are inspected to ensure high standards." },
      { title: "Shorter courses", line: "Most undergraduate courses last three years." },
      { title: "Work and study", line: "20 hours a week during term and full-time in holidays." },
    ],
    academic: "UK university academic years generally run from September to June, with the summer months for a master's dissertation.",
    work: "International students can work 20 hours a week during term and full-time in holidays.",
    migrationTitle: "Migration to the United Kingdom",
    migration: [
      { title: "Tier 1 (Graduate Entrepreneur)", line: "For graduates developing their own business in the UK." },
      { title: "Tier 2 (General)", line: "For recent graduates with a job offer from a licensed sponsor." },
      { title: "Tier 5 Temporary Worker", line: "Work experience for up to 12 or 24 months." },
    ],
    whyTitle: "Why choose the UK",
    why: [
      "Universities inspected to ensure high standards, with top academics and skill development.",
      "Shorter courses mean quicker graduation.",
      "Work 20 hours a week during term and full-time in holidays.",
    ],
    costs: [
      { title: "Cost of living", line: "Between 9,500 and 14,000 GBP per year for housing and living. London costs substantially more." },
      { title: "Cost of studying", line: "Undergraduate £9,000 to £38,000. Postgraduate £9,000 to £30,000." },
      { title: "Visa application fees", line: "A 6-month visa is roughly 97 GBP and an 11-month visa around 186 GBP." },
    ],
    checklistTitle: "Before applying for a student visa",
    checklist: ["Valid passport", "Travel documents", "Sponsor information", "Purpose of visiting (training, research or paid engagement)"],
    help: [
      { title: "Free consultation", line: "Get professional counselling." },
      { title: "Visa guidance", line: "Complete visa guidance for the UK." },
      { title: "Test preparation classes", line: "Tests with our live classes." },
    ],
  },
];

export const destinationBySlug = (slug: string) => destinations.find((d) => d.slug === slug);
