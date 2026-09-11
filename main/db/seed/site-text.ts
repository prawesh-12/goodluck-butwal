import { sql } from "drizzle-orm";
import { db } from "@db/client";
import { settings, uiStrings } from "@db/schema";
import { footerLinks, social } from "@/config/site";

type StringRow = { key: string; value: string; group: string; label: string; help: string };

// Footer columns become one row per link, so an admin can retitle or repoint one without a
// developer. The key carries the column and position.
function footerRows(): StringRow[] {
  const rows: StringRow[] = [];

  for (const [column, links] of Object.entries(footerLinks)) {
    const slug = column.toLowerCase();
    rows.push({
      key: `footer.${slug}.title`,
      value: column,
      group: "footer",
      label: `${column} column heading`,
      help: "The heading above this group of footer links.",
    });

    links.forEach((link, index) => {
      rows.push({
        key: `footer.${slug}.${index}.label`,
        value: link.label,
        group: "footer",
        label: `${column} link ${index + 1} text`,
        help: `Points at ${link.href}.`,
      });
      rows.push({
        key: `footer.${slug}.${index}.href`,
        value: link.href,
        group: "footer",
        label: `${column} link ${index + 1} address`,
        help: "Where the link goes. Start with / for a page on this site.",
      });
    });
  }
  return rows;
}

export function uiStringRows(): StringRow[] {
  return [...footerRows(), ...homeRows, ...innerPageRows, ...errorRows, ...formRows, ...chromeRows, ...pageRows, ...lastRows, ...strayRows];
}

export async function seedUiStrings() {
  const rows = uiStringRows();

  await db
    .insert(uiStrings)
    .values(rows)
    // Only the wording an admin has not touched is refreshed; the value is left alone.
    .onConflictDoUpdate({
      target: uiStrings.key,
      set: { label: sql`excluded.label`, help: sql`excluded.help`, group: sql`excluded."group"` },
    });
  return rows.length;
}

export async function seedSettings() {
  const rows = [
    {
      key: "social_links",
      value: social.map((s) => ({ label: s.label, href: s.href, icon: s.icon })),
    },
  ];

  await db.insert(settings).values(rows).onConflictDoNothing({ target: settings.key });
  return rows.length;
}

const innerPageRows: StringRow[] = [
  { key: "study.help.1", value: "Document check", group: "study", label: "Help tile 1", help: "One of the five things we do for you, on the study abroad page." },
  { key: "study.help.2", value: "Application process", group: "study", label: "Help tile 2", help: "One of the five things we do for you, on the study abroad page." },
  { key: "study.help.3", value: "Visa application", group: "study", label: "Help tile 3", help: "One of the five things we do for you, on the study abroad page." },
  { key: "study.help.4", value: "Follow-up with embassy", group: "study", label: "Help tile 4", help: "One of the five things we do for you, on the study abroad page." },
  { key: "study.help.5", value: "Language coaching", group: "study", label: "Help tile 5", help: "One of the five things we do for you, on the study abroad page." },

  { key: "about.hero.badge", value: "About Goodluck", group: "about", label: "About page badge", help: "The small pill above the heading at the top of the About page." },
  { key: "about.hero.title", value: "About Goodluck Education & Migration", group: "about", label: "About page heading", help: "The main heading at the top of the About page." },
  { key: "about.mission.title", value: "Our mission", group: "about", label: "Mission heading", help: "Sits above the mission text on the About page." },
  { key: "about.vision.title", value: "Our vision", group: "about", label: "Vision heading", help: "Sits above the vision text on the About page." },
  { key: "about.mission.cta", value: "Meet the team", group: "about", label: "Team button under the mission", help: "Button under the mission and vision text on the About page." },
  { key: "about.values.title", value: "Our values and ethics", group: "about", label: "Values heading", help: "Sits above the values text on the About page." },
  { key: "about.founders.title", value: "Message from co-founders", group: "about", label: "Co-founders heading", help: "Heads the co-founders panel on the About page and the co-founders page itself." },
  { key: "about.founders.role", value: "Co-founders", group: "about", label: "Co-founders job title", help: "Printed under the founders' names on their photo." },
  { key: "about.journey.title", value: "Our journey", group: "about", label: "Journey heading", help: "Heading inside the co-founders panel." },
  { key: "about.journey.lead", value: "A note from the co-founders", group: "about", label: "Journey subheading", help: "The line under the journey heading." },
  { key: "about.founders.cta", value: "Read the full message", group: "about", label: "Full message button", help: "Button at the end of the co-founders panel." },
  { key: "about.numbers.title", value: "Goodluck in numbers", group: "about", label: "Numbers heading", help: "Heading above the six fact cards on the About page." },
  { key: "about.numbers.cta", value: "Explore our services", group: "about", label: "Services button in the numbers block", help: "Button beside the six fact cards on the About page." },
  { key: "about.stats.established.label", value: "Established", group: "about", label: "Established card title", help: "Title on the first fact card on the About page." },
  { key: "about.stats.established.value", value: "2022", group: "about", label: "Established card number", help: "The big number on the established card." },
  { key: "about.stats.established.text", value: "Education and migration guidance since 2022.", group: "about", label: "Established card text", help: "The line under the number on the established card." },
  { key: "about.stats.offices.label", value: "Offices worldwide", group: "about", label: "Offices card title", help: "Title on the offices fact card. The number is counted automatically." },
  { key: "about.stats.offices.text", value: "Melbourne, Butwal and Cebu.", group: "about", label: "Offices card text", help: "The line under the number on the offices card." },
  { key: "about.stats.team.label", value: "Team members", group: "about", label: "Team card title", help: "Title on the team fact card. The number is counted automatically." },
  { key: "about.stats.team.text", value: "Counsellors, migration and admission staff.", group: "about", label: "Team card text", help: "The line under the number on the team card." },
  { key: "about.stats.partners.label", value: "Partner institutions", group: "about", label: "Partners card title", help: "Title on the partner institutions fact card." },
  { key: "about.stats.partners.value", value: "100+", group: "about", label: "Partners card number", help: "The big number on the partner institutions card." },
  { key: "about.stats.partners.text", value: "Colleges, institutions, universities and TAFE facilities we represent.", group: "about", label: "Partners card text", help: "The line under the number on the partner institutions card." },
  { key: "about.stats.rating.label", value: "Google rating", group: "about", label: "Google rating card title", help: "Title on the Google rating card. The score comes from settings." },
  { key: "about.stats.rating.text", value: "Based on {count} client reviews.", group: "about", label: "Google rating card text", help: "The line under the score. Write {count} where the number of reviews should go." },
  { key: "about.stats.languages.label", value: "Languages", group: "about", label: "Languages card title", help: "Title on the languages fact card." },
  { key: "about.stats.languages.value", value: "5+", group: "about", label: "Languages card number", help: "The big number on the languages card." },
  { key: "about.stats.languages.text", value: "Certified counsellors who speak your language.", group: "about", label: "Languages card text", help: "The line under the number on the languages card." },
  { key: "about.team.badge", value: "Expert team members", group: "about", label: "Team section badge", help: "The small pill above the team photos on the About page." },
  { key: "about.team.title", value: "Our team at your service", group: "about", label: "Team section heading", help: "Heading above the team photos on the About page." },
  { key: "about.team.cta", value: "Meet the whole team", group: "about", label: "Whole team button", help: "Button under the team photos on the About page." },
  { key: "about.offices.title", value: "Global offices in Australia, Philippines and Nepal", group: "about", label: "Offices strip heading", help: "Heading in the offices panel at the foot of the About page." },
  { key: "contact.hero.badge", value: "Quick contact", group: "contact", label: "Contact page badge", help: "The small pill above the heading at the top of the Contact page." },
  { key: "contact.hero.title", value: "Don’t hesitate to contact us", group: "contact", label: "Contact page heading", help: "The main heading at the top of the Contact page." },
  { key: "contact.hero.lead", value: "Let’s connect. Make a free consultation with our expert team.", group: "contact", label: "Contact page intro", help: "The line under the heading on the Contact page." },
  { key: "contact.offices.badge", value: "Our worldwide offices", group: "contact", label: "Offices section badge", help: "The small pill above the office cards on the Contact page." },
  { key: "contact.offices.title", value: "Explore our office worldwide", group: "contact", label: "Offices section heading", help: "Heading above the office cards on the Contact page." },
  { key: "contact.offices.maps_link", value: "Open in Maps", group: "contact", label: "Maps link text", help: "The link on every office card that opens Google Maps." },
  { key: "contact.offices.whatsapp_link", value: "Chat on WhatsApp", group: "contact", label: "WhatsApp link text", help: "The link beside the phone number on an office card. Only shows for an office with a WhatsApp number." },
  { key: "contact.faq.title", value: "Frequently asked questions", group: "contact", label: "Contact FAQ heading", help: "Heading above the questions at the foot of the Contact page." },
  { key: "contact.faq.lead", value: "Common questions about programmes, scholarships and visas.", group: "contact", label: "Contact FAQ intro", help: "The line under the FAQ heading on the Contact page." },
  { key: "contact.booking.badge", value: "Book a consultation", group: "contact", label: "Booking page badge", help: "The small pill above the heading on the booking page." },
  { key: "contact.booking.title", value: "Book an appointment", group: "contact", label: "Booking page heading", help: "The main heading on the booking page." },
  { key: "contact.booking.lead", value: "Choose an office, a service and a time that suits you.", group: "contact", label: "Booking page intro", help: "The line under the heading on the booking page." },
  { key: "contact.booking.help_before_phone", value: "Questions? Call", group: "contact", label: "Booking help text before the phone number", help: "Printed under the booking form, just before the phone number." },
  { key: "contact.booking.help_after_phone", value: "for help.", group: "contact", label: "Booking help text after the phone number", help: "Printed under the booking form, just after the phone number." },
  { key: "services.hero.badge", value: "Our services", group: "services", label: "Services page badge", help: "The small pill above the heading at the top of the Services page." },
  { key: "services.hero.title", value: "Get the right help", group: "services", label: "Services page heading", help: "The main heading at the top of the Services page." },
  { key: "services.hero.lead", value: "We have the perfect solution for international students. Now, they no longer have to worry about education counselling, finding work, obtaining visas, or anything else.", group: "services", label: "Services page intro", help: "The paragraph under the heading on the Services page." },
  { key: "services.faq.title", value: "Frequently asked questions", group: "services", label: "Services FAQ heading", help: "Heading above the questions at the foot of the Services page." },
  { key: "services.faq.lead", value: "Common questions about programmes, universities and scholarships.", group: "services", label: "Services FAQ intro", help: "The line under the FAQ heading on the Services page." },
  { key: "services.detail.steps.badge", value: "How it works", group: "services", label: "Steps badge on a service page", help: "The small pill above the numbered steps on a single service page." },
  { key: "services.detail.facts.badge", value: "At a glance", group: "services", label: "Facts badge on a service page", help: "The small pill above the four fact tiles on a single service page." },
  { key: "services.detail.facts.title", value: "IELTS at a glance", group: "services", label: "Facts heading on a service page", help: "Heading above the four fact tiles on a single service page." },
  { key: "services.detail.list.cta", value: "Book a consultation", group: "services", label: "Button under the service list panel", help: "Button in the grey panel that lists what a service covers." },
  { key: "services.detail.faq.title", value: "Common questions", group: "services", label: "Service page FAQ heading", help: "Heading above the questions on a single service page." },
  { key: "services.detail.faq.lead", value: "Answers from the Goodluck team.", group: "services", label: "Service page FAQ intro", help: "The line under the FAQ heading on a single service page." },
  { key: "services.detail.others.badge", value: "More services", group: "services", label: "Other services badge", help: "The small pill above the other service cards at the foot of a service page." },
  { key: "services.detail.others.title", value: "Other ways we can help", group: "services", label: "Other services heading", help: "Heading above the other service cards at the foot of a service page." },
  { key: "study.hero.badge", value: "Study abroad", group: "study", label: "Study abroad page badge", help: "The small pill above the heading at the top of the Study abroad page." },
  { key: "study.hero.title", value: "Countries we help you study in", group: "study", label: "Study abroad page heading", help: "The main heading at the top of the Study abroad page." },
  { key: "study.hero.lead", value: "Study in Australia, the United Kingdom and New Zealand with us.", group: "study", label: "Study abroad page intro", help: "The line under the heading on the Study abroad page." },
  { key: "study.help.badge", value: "How we help", group: "study", label: "Help section badge", help: "The small pill above the five help tiles on the Study abroad page." },
  { key: "study.help.title", value: "Some of the help we provide", group: "study", label: "Help section heading", help: "Heading above the five help tiles on the Study abroad page." },
  { key: "study.faq.title", value: "Education services FAQ", group: "study", label: "Study abroad FAQ heading", help: "Heading above the questions at the foot of the Study abroad page." },
  { key: "study.faq.lead", value: "Common questions about programmes, universities and scholarships.", group: "study", label: "Study abroad FAQ intro", help: "The line under the FAQ heading on the Study abroad page." },
  { key: "study.destination.hero.title_prefix", value: "Study in", group: "study", label: "Country page heading start", help: "Printed before the country name in the heading, so it reads 'Study in Australia'." },
  { key: "study.destination.hero.chip", value: "Study abroad", group: "study", label: "Country page chip", help: "The small pill beside the flag at the top of a country page." },
  { key: "study.destination.academic.badge", value: "Education", group: "study", label: "Academic card badge", help: "The small pill on the academic period card on a country page." },
  { key: "study.destination.academic.title", value: "Academic period", group: "study", label: "Academic card heading", help: "Heading on the academic period card on a country page." },
  { key: "study.destination.work.badge", value: "Work", group: "study", label: "Work card badge", help: "The small pill on the work card on a country page." },
  { key: "study.destination.work.title", value: "Work while you study", group: "study", label: "Work card heading", help: "Heading on the work card on a country page." },
  { key: "study.destination.migration.badge", value: "Migration", group: "study", label: "Migration section badge", help: "The small pill above the migration cards on a country page." },
  { key: "study.destination.migration.note", value: "Indicative only. Confirm current visa details with a Goodluck counsellor.", group: "study", label: "Migration section note", help: "The line under the migration heading on a country page." },
  { key: "study.destination.why.badge_prefix", value: "Why", group: "study", label: "Why section badge start", help: "Printed before the country name in the badge, so it reads 'Why Australia'." },
  { key: "study.destination.why.cta", value: "Book a consultation", group: "study", label: "Why section button", help: "Button in the 'why this country' block on a country page." },
  { key: "study.destination.costs.title", value: "Estimated costs", group: "study", label: "Costs card heading", help: "Heading on the costs card on a country page, when costs are filled in." },
  { key: "study.destination.costs.note", value: "Indicative only. Confirm current figures with a Goodluck counsellor.", group: "study", label: "Costs card note", help: "The small print at the foot of the costs card on a country page." },
  { key: "study.destination.help_card.title", value: "How we help", group: "study", label: "Help card heading", help: "Heading on the card that replaces costs when a country has no cost figures." },
  { key: "study.destination.help.badge", value: "How we help", group: "study", label: "Help section badge", help: "The small pill above the help steps on a country page." },
  { key: "study.destination.help.title", value: "From free consultation to visa", group: "study", label: "Help section heading", help: "Heading above the help steps on a country page." },
  { key: "study.destination.help.cta", value: "Book a free consultation", group: "study", label: "Help section button", help: "Button under the help steps on a country page." },
  { key: "study.destination.institutions.badge", value: "Institutions", group: "study", label: "Institutions section badge", help: "The small pill above the institution cards on a country page." },
  { key: "study.destination.institutions.title_prefix", value: "Relevant institutions in", group: "study", label: "Institutions heading start", help: "Printed before the country name, so it reads 'Relevant institutions in Australia'." },
  { key: "study.destination.institutions.cta", value: "See all institutions", group: "study", label: "Institutions button", help: "Button under the institution cards on a country page." },
  { key: "study.destination.news.badge", value: "News", group: "study", label: "News section badge", help: "The small pill above the news cards on a country page." },
  { key: "study.destination.news.title_prefix", value: "Latest on", group: "study", label: "News heading start", help: "Printed before the country name, so it reads 'Latest on Australia'." },
  { key: "study.destination.faq.title", value: "Frequently asked questions", group: "study", label: "Country page FAQ heading", help: "Heading above the questions at the foot of a country page." },
  { key: "study.destination.faq.lead", value: "Common questions about programmes, scholarships and visas.", group: "study", label: "Country page FAQ intro", help: "The line under the FAQ heading on a country page." },
  { key: "stories.hero.badge", value: "Success stories", group: "stories", label: "Success stories badge", help: "The small pill above the heading at the top of the Success stories page." },
  { key: "stories.hero.title", value: "Highly recommended", group: "stories", label: "Success stories heading", help: "The main heading at the top of the Success stories page." },
  { key: "stories.hero.lead", value: "Visa grants and reviews shared by our clients.", group: "stories", label: "Success stories intro", help: "The line under the heading on the Success stories page." },
  { key: "stories.reviews.title", value: "What our clients say", group: "stories", label: "Reviews heading", help: "Heading above the review cards on the Success stories page." },
  { key: "stories.reviews.rating", value: "{score} Google rating", group: "stories", label: "Google rating line", help: "Beside the star on the Success stories page. Write {score} where the rating should go." },
  { key: "stories.reviews.count", value: "Based on {count} reviews", group: "stories", label: "Review count line", help: "Beside the rating on the Success stories page. Write {count} where the number should go." },
  { key: "stories.reviews.cta", value: "Book a consultation", group: "stories", label: "Reviews button", help: "Button beside the reviews heading on the Success stories page." },
  { key: "faq.hero.title", value: "Frequently asked questions", group: "faq", label: "FAQ page heading", help: "The main heading at the top of the FAQ page." },
  { key: "faq.hero.lead", value: "Any questions? Book an appointment and our team can assess your case.", group: "faq", label: "FAQ page intro", help: "The line under the heading on the FAQ page." },
  { key: "faq.groups.education", value: "Education services", group: "faq", label: "Education group heading", help: "Heading above the first group of questions on the FAQ page." },
  { key: "faq.groups.migration", value: "Migration services", group: "faq", label: "Migration group heading", help: "Heading above the second group of questions on the FAQ page." },
];

const homeRows: StringRow[] = [
  { key: "home.destinations.badge", value: "Study abroad", group: "home", label: "Destinations badge", help: "The small pill above the destination cards on the home page." },
  { key: "home.destinations.title", value: "Countries we help you study in", group: "home", label: "Destinations heading", help: "Heading above the destination cards on the home page." },
  { key: "home.destinations.lead", value: "Study in Australia, the United Kingdom and New Zealand with us.", group: "home", label: "Destinations intro", help: "The line under the destinations heading on the home page." },
  { key: "home.destinations.card_cta", value: "Book a consultation", group: "home", label: "Destination card pill", help: "The pill on a destination card that has no figure to show, such as New Zealand." },
  { key: "home.services.badge", value: "Our services", group: "home", label: "Services badge", help: "The small pill above the services heading on the home page." },
  { key: "home.services.title", value: "Get the right help", group: "home", label: "Services heading", help: "Heading above the four service tiles on the home page." },
  { key: "home.services.lead", value: "Education counselling, visa guidance, scholarship guidance and IELTS coaching.", group: "home", label: "Services intro", help: "The line beside the services heading on the home page." },
  { key: "home.services.cta", value: "View all services", group: "home", label: "Services button", help: "Button beside the services heading on the home page." },
  { key: "home.reviews.badge", value: "Why choose us", group: "home", label: "Why choose us badge", help: "The small pill above the reviews block on the home page." },
  { key: "home.reviews.title", value: "Reason for choosing us", group: "home", label: "Why choose us heading", help: "Heading above the reviews block on the home page." },
  { key: "home.reviews.cta", value: "About Goodluck", group: "home", label: "Why choose us button", help: "Button under the reviews heading on the home page." },
  { key: "home.reviews.clients_title", value: "What our clients say", group: "home", label: "Reviews heading", help: "Heading above the moving rows of Google reviews on the home page." },
  { key: "home.reviews.rating", value: "{score} Google rating", group: "home", label: "Google rating line", help: "Beside the star on the home page. Write {score} where the rating should go." },
  { key: "home.reviews.count", value: "{count} reviews", group: "home", label: "Review count line", help: "Beside the rating on the home page. Write {count} where the number should go." },
  { key: "home.reviews.source", value: "Google review, {date}", group: "home", label: "Review card source", help: "Under the reviewer name on each review card. Write {date} where the date should go." },
  { key: "home.stories.badge", value: "Success stories", group: "home", label: "Success stories badge", help: "The small pill above the success stories on the home page." },
  { key: "home.stories.title", value: "Highly recommended", group: "home", label: "Success stories heading", help: "Heading above the success stories on the home page." },
  { key: "home.stories.lead", value: "Visa grants and reviews shared by our clients.", group: "home", label: "Success stories intro", help: "The line under the success stories heading on the home page." },
  { key: "home.stories.rating", value: "from {count} Google reviews", group: "home", label: "Success stories rating line", help: "Under the score beside the success stories heading. Write {count} where the number should go." },
  { key: "home.stories.cta", value: "All success stories", group: "home", label: "Success stories button", help: "Button under the success stories on the home page." },
  { key: "home.offices.badge", value: "Migration", group: "home", label: "Migration badge", help: "The small pill above the migration panel on the home page." },
  { key: "home.offices.title", value: "Fly your dream destination", group: "home", label: "Migration heading", help: "Heading in the migration panel on the home page." },
  { key: "home.offices.lead", value: "Apply for your visa now!", group: "home", label: "Migration intro", help: "The line under the migration heading on the home page." },
  { key: "home.offices.pathway.1", value: "Entering & leaving from country", group: "home", label: "Migration item 1", help: "First ticked item in the migration panel on the home page." },
  { key: "home.offices.pathway.2", value: "Visas", group: "home", label: "Migration item 2", help: "Second ticked item in the migration panel on the home page." },
  { key: "home.offices.pathway.3", value: "Country citizenship", group: "home", label: "Migration item 3", help: "Third ticked item in the migration panel on the home page." },
  { key: "home.offices.pathway.4", value: "Settling in country", group: "home", label: "Migration item 4", help: "Fourth ticked item in the migration panel on the home page." },
  { key: "home.offices.pathway.5", value: "Help & support", group: "home", label: "Migration item 5", help: "Fifth ticked item in the migration panel on the home page." },
  { key: "home.offices.cta", value: "Book a consultation", group: "home", label: "Migration button", help: "Button in the migration panel on the home page." },
  { key: "home.offices.destinations", value: "Australia, New Zealand and the UK", group: "home", label: "Migration flags line", help: "Beside the three flags under the plane on the home page." },
  { key: "home.offices.claim.before", value: "Official representative of", group: "home", label: "Partner claim, first part", help: "Before the number in the line under the ring of partner logos." },
  { key: "home.offices.claim.count", value: "100+", group: "home", label: "Partner claim, number", help: "The highlighted number in the line under the ring of partner logos." },
  { key: "home.offices.claim.after", value: "colleges, universities and TAFE facilities", group: "home", label: "Partner claim, last part", help: "After the number in the line under the ring of partner logos." },
  { key: "home.news.badge", value: "News and updates", group: "home", label: "News badge", help: "The small pill above the three news cards on the home page." },
  { key: "home.news.title", value: "Study abroad insights and visa tips", group: "home", label: "News heading", help: "Heading above the three news cards on the home page." },
  { key: "home.news.cta", value: "All news", group: "home", label: "News button", help: "Button beside the news heading on the home page." },
  { key: "home.faqs.title", value: "Frequently asked questions", group: "home", label: "Home FAQ heading", help: "Heading above the questions at the foot of the home page." },
  { key: "home.faqs.lead", value: "Common questions about programmes, scholarships and visas.", group: "home", label: "Home FAQ intro", help: "The line under the FAQ heading on the home page." },
  { key: "home.faqs.still.title", value: "Still have questions?", group: "home", label: "Still have questions title", help: "Title on the card beside the home page questions." },
  { key: "home.faqs.still.line", value: "Book an appointment and our team can assess your case.", group: "home", label: "Still have questions text", help: "The line under that title on the home page." },
  { key: "home.faqs.still.cta", value: "Book an appointment", group: "home", label: "Still have questions button", help: "Button on that card on the home page." },
  { key: "home.faqs.still.you", value: "You", group: "home", label: "Still have questions circle", help: "The word in the blue circle after the counsellor photos." },
];

const errorRows: StringRow[] = [
  { key: "errors.404.badge", value: "Something went wrong", group: "errors", label: "Page not found badge", help: "The small pill at the top of the page shown when an address does not exist." },
  { key: "errors.404.title", value: "Page not found", group: "errors", label: "Page not found heading", help: "The heading on the page shown when an address does not exist." },
  { key: "errors.404.body", value: "The page you are looking for doesn\u2019t exist or has been moved.", group: "errors", label: "Page not found text", help: "The line under the heading when an address does not exist." },
  { key: "errors.404.cta", value: "Back to home", group: "errors", label: "Page not found button", help: "The button on the page shown when an address does not exist." },

  { key: "empty.courses.title", value: "No courses match those filters", group: "errors", label: "No matching courses heading", help: "Shown on the courses page when the filters return nothing." },
  { key: "empty.courses.lead", value: "Clear a filter to widen the search, or ask a counsellor what is open for your intake.", group: "errors", label: "No matching courses text", help: "The line under that heading on the courses page." },
  { key: "empty.institutions.title", value: "No institutions listed yet", group: "errors", label: "No institutions heading", help: "Shown on the institutions page when nothing is published." },
  { key: "empty.institutions.lead", value: "Tell us where you want to study and a counsellor will send you the options.", group: "errors", label: "No institutions text", help: "The line under that heading on the institutions page." },
  { key: "empty.institution_courses.title", value: "No courses listed yet", group: "errors", label: "Institution with no courses heading", help: "Shown on an institution page that has no published courses." },
  { key: "empty.institution_courses.lead", value: "Ask a counsellor which programmes this institution is taking applications for.", group: "errors", label: "Institution with no courses text", help: "The line under that heading on an institution page." },
  { key: "empty.search.prompt.title", value: "Type something to search", group: "errors", label: "Search page opening heading", help: "Shown on the search page before anything has been typed." },
  { key: "empty.search.prompt.lead", value: "Try a course name, an institution, a country, or a keyword such as scholarship.", group: "errors", label: "Search page opening text", help: "The line under that heading on the search page." },
  { key: "empty.search.prompt.cta", value: "Browse courses", group: "errors", label: "Search page opening button", help: "The button shown on the search page before anything has been typed." },
  { key: "empty.search.title", value: "Nothing matches \u201c{q}\u201d", group: "errors", label: "No search results heading", help: "Shown when a search finds nothing. Write {q} where the words searched for should go." },
  { key: "empty.search.lead", value: "Try a shorter word, a country name, or the name of a course or institution. A counsellor can also look for you.", group: "errors", label: "No search results text", help: "The line under that heading on the search page." },
  { key: "empty.events.upcoming", value: "Nothing is coming up just now. Check back soon.", group: "errors", label: "No upcoming events", help: "Shown on the events page under the Upcoming tab when nothing is planned." },
  { key: "empty.events.past", value: "No past events yet.", group: "errors", label: "No past events", help: "Shown on the events page under the Past tab." },
  { key: "empty.batches", value: "No batches are open for booking yet. Ask us about the next one.", group: "errors", label: "No test preparation batches", help: "Shown where the IELTS and PTE batch table would be when none are open." },
];

const formRows: StringRow[] = [
  { key: "forms.required_note", value: "", group: "forms", label: "Note above every form", help: "Shown above every form on the site. Leave it empty and no note appears." },
  { key: "forms.error", value: "That did not go through. Try again.", group: "forms", label: "Send failed message", help: "Shown under a form when sending fails for a reason we cannot name." },
  { key: "forms.sending", value: "Sending", group: "forms", label: "Button text while sending", help: "Replaces the button wording while a form is being sent." },
  { key: "forms.reference", value: "Your reference is", group: "forms", label: "Reference line", help: "Comes before the reference code in the message after an enquiry or booking." },

  { key: "forms.enquiry.intro", value: "", group: "forms", label: "Above the enquiry form", help: "Shown above the enquiry form on the Contact page. Leave it empty and nothing appears." },
  { key: "forms.enquiry.success", value: "Thanks, we have your enquiry. A counsellor will get back to you.", group: "forms", label: "After sending an enquiry", help: "Replaces the enquiry form once it has been sent." },
  { key: "forms.enquiry.submit", value: "Submit now", group: "forms", label: "Enquiry form button", help: "The button at the foot of the enquiry form." },

  { key: "forms.consultation.intro", value: "", group: "forms", label: "Above the booking form", help: "Shown above the booking form. Leave it empty and nothing appears." },
  { key: "forms.consultation.success", value: "Request received. We will confirm by email within one business day.", group: "forms", label: "After requesting an appointment", help: "Replaces the booking form once it has been sent." },
  { key: "forms.consultation.not_held", value: "That time is not held until we confirm it.", group: "forms", label: "Booking not held note", help: "The quiet line under the appointment summary after someone books." },
  { key: "forms.consultation.submit", value: "Book appointment", group: "forms", label: "Booking form button", help: "The button at the foot of the booking form." },

  { key: "forms.event.success", value: "You are registered. We have emailed you the details. Reply to that email if you can no longer make it.", group: "forms", label: "After registering for an event", help: "Replaces the registration form on an event page once it has been sent." },
  { key: "forms.event.submit", value: "Register", group: "forms", label: "Event registration button", help: "The button at the foot of the form on an event page." },

  { key: "forms.field.name", value: "Full name*", group: "forms", label: "Name field", help: "The label above the name box. A star marks a field someone has to fill in." },
  { key: "forms.field.name_hint", value: "Your full name", group: "forms", label: "Name field hint", help: "The grey wording inside the empty name box." },
  { key: "forms.field.email", value: "Email address*", group: "forms", label: "Email field", help: "The label above the email box." },
  { key: "forms.field.email_hint", value: "you@example.com", group: "forms", label: "Email field hint", help: "The grey wording inside the empty email box." },
  { key: "forms.field.phone", value: "Phone number", group: "forms", label: "Phone field", help: "The label above the phone box where a phone number is optional." },
  { key: "forms.field.phone_required", value: "Phone number*", group: "forms", label: "Phone field, required", help: "The label above the phone box on the booking form, where it has to be filled in." },
  { key: "forms.field.phone_hint", value: "Your contact number", group: "forms", label: "Phone field hint", help: "The grey wording inside the empty phone box." },
  { key: "forms.field.location", value: "Current location", group: "forms", label: "Location field", help: "The label above the location box on the enquiry form." },
  { key: "forms.field.location_hint", value: "City, country", group: "forms", label: "Location field hint", help: "The grey wording inside the empty location box." },
  { key: "forms.field.destination", value: "Interested destination", group: "forms", label: "Destination list", help: "The label above the country list on the enquiry form." },
  { key: "forms.field.destination_hint", value: "Choose a destination", group: "forms", label: "Destination list, nothing chosen", help: "The first line of the country list, before a country is chosen." },
  { key: "forms.field.service", value: "Interested service", group: "forms", label: "Service list", help: "The label above the service list on the enquiry form." },
  { key: "forms.field.service_required", value: "Service*", group: "forms", label: "Service list, required", help: "The label above the service list on the booking form, where one has to be chosen." },
  { key: "forms.field.service_hint", value: "Choose a service", group: "forms", label: "Service list, nothing chosen", help: "The first line of the service list, before a service is chosen." },
  { key: "forms.field.message", value: "Message*", group: "forms", label: "Message field", help: "The label above the message box on the enquiry form." },
  { key: "forms.field.message_hint", value: "How can we help?", group: "forms", label: "Message field hint", help: "The grey wording inside the empty message box." },
  { key: "forms.field.office", value: "Office*", group: "forms", label: "Office list", help: "The label above the office list on the booking form." },
  { key: "forms.field.date", value: "Preferred date*", group: "forms", label: "Date field", help: "The label above the date box on the booking form." },
  { key: "forms.field.time", value: "Preferred time*", group: "forms", label: "Time field", help: "The label above the time box on the booking form." },
  { key: "forms.field.contact_method", value: "Preferred contact method", group: "forms", label: "Contact method list", help: "The label above the phone or email choice on the booking form." },
  { key: "forms.field.contact_phone", value: "Phone", group: "forms", label: "Contact method, phone", help: "The phone option in the contact method list." },
  { key: "forms.field.contact_email", value: "Email", group: "forms", label: "Contact method, email", help: "The email option in the contact method list." },
  { key: "forms.field.notes", value: "Additional notes", group: "forms", label: "Notes field", help: "The label above the notes box on the booking form." },
  { key: "forms.field.notes_hint", value: "Anything we should know before we meet?", group: "forms", label: "Notes field hint", help: "The grey wording inside the empty notes box on the booking form." },
  { key: "forms.field.attendees", value: "How many are coming", group: "forms", label: "Attendee count field", help: "The label above the number of people on an event registration." },
  { key: "forms.field.event_notes", value: "Anything we should know", group: "forms", label: "Event notes field", help: "The label above the notes box on an event registration." },
  { key: "forms.field.seats_left", value: "{count} seats left.", group: "forms", label: "Seats left note", help: "Shown under the number of people on an event registration. Write {count} where the number should go." },
];

const chromeRows: StringRow[] = [
  { key: "nav.book_cta", value: "Book a consultation", group: "nav", label: "Header button", help: "The dark button in the site header. It is hidden on the contact pages." },
  { key: "nav.menu_open", value: "Open menu", group: "nav", label: "Menu button, closed", help: "Read aloud for the small menu button on phones when the menu is shut." },
  { key: "nav.menu_close", value: "Close menu", group: "nav", label: "Menu button, open", help: "Read aloud for the small menu button on phones when the menu is open." },

  { key: "footer.tagline", value: "Ready to create your luck?", group: "footer", label: "Footer heading", help: "The line under the logo at the foot of every page." },
  { key: "footer.offices.title", value: "Offices", group: "footer", label: "Footer offices heading", help: "The heading above the office addresses in the footer." },
  { key: "footer.copyright", value: "\u00a9 {year} {name}. All rights reserved.", group: "footer", label: "Copyright line", help: "The last line of the footer. Write {year} for the current year and {name} for the company name." },
  { key: "footer.staff_login", value: "Staff login", group: "footer", label: "Staff login link", help: "The quiet link in the last line of the footer that opens the admin sign in page." },

  { key: "cta.consultation", value: "Book a free consultation", group: "cta", label: "Consultation button", help: "Used at the foot of the team, institution and empty-list pages." },
  { key: "cta.appointment", value: "Book an appointment", group: "cta", label: "Appointment button", help: "Used at the foot of the test preparation batches page." },
  { key: "cta.enquiry", value: "Enquire about this course", group: "cta", label: "Course enquiry button", help: "The button at the foot of a course page." },
  { key: "cta.website", value: "Visit website", group: "cta", label: "Institution website button", help: "The button that opens an institution's own site." },
  { key: "cta.previous", value: "Previous", group: "cta", label: "Previous page button", help: "Moves back a page in a list of courses or institutions." },
  { key: "cta.next", value: "Next", group: "cta", label: "Next page button", help: "Moves on a page in a list of courses or institutions." },
  { key: "cta.page_of", value: "Page {page} of {pages}", group: "cta", label: "Page counter", help: "Sits between the two page buttons. Write {page} and {pages} where the numbers should go." },
  { key: "cta.person.title", value: "Talk to {name}", group: "cta", label: "Team member panel heading", help: "The heading at the foot of a team member's page. Write {name} where their first name should go." },
  { key: "cta.person.lead", value: "Book a free consultation and we will put you with the right person for your case.", group: "cta", label: "Team member panel text", help: "The line under that heading." },
  { key: "cta.course.title", value: "Ask about this course", group: "cta", label: "Course panel heading", help: "The heading at the foot of a course page." },
  { key: "cta.course.lead", value: "Send an enquiry and a counsellor will come back with entry requirements, fees and the next intake.", group: "cta", label: "Course panel text", help: "The line under that heading." },
  { key: "cta.institution.title", value: "Thinking about {name}?", group: "cta", label: "Institution panel heading", help: "The heading at the foot of an institution page. Write {name} where the institution's name should go." },
  { key: "cta.institution.lead", value: "A counsellor can check entry requirements, intakes and fees with you.", group: "cta", label: "Institution panel text", help: "The line under that heading." },
  { key: "cta.questions.title", value: "Still have questions?", group: "cta", label: "Questions panel heading", help: "The heading above the button at the foot of the batches page." },

  { key: "home.hero.title_before", value: "Create your", group: "home", label: "Headline, before the mark", help: "The first half of the homepage headline. The logo mark sits between the two halves." },
  { key: "home.hero.title_after", value: "luck", group: "home", label: "Headline, after the mark", help: "The second half of the homepage headline." },
  { key: "home.hero.cta", value: "Book a consultation", group: "home", label: "Homepage first button", help: "The blue button under the homepage headline." },
  { key: "home.hero.services_cta", value: "Our services", group: "home", label: "Homepage second button", help: "The plain button beside it." },
  { key: "home.events.badge", value: "Events", group: "home", label: "Events block badge", help: "The small pill above the events on the homepage." },
  { key: "home.events.title", value: "Coming up near you", group: "home", label: "Events block heading", help: "The heading above the events on the homepage." },
  { key: "home.events.cta", value: "All events", group: "home", label: "Events block button", help: "The button beside that heading." },


  { key: "courses.filter.keyword", value: "Keyword", group: "courses", label: "Keyword box", help: "The label above the keyword box on the courses page." },
  { key: "courses.filter.keyword_hint", value: "Course, institution or country", group: "courses", label: "Keyword box hint", help: "The grey wording inside the empty keyword box." },
  { key: "courses.filter.destination", value: "Destination", group: "courses", label: "Destination list", help: "The label above the country list on the courses page." },
  { key: "courses.filter.destination_any", value: "All destinations", group: "courses", label: "Destination list, nothing chosen", help: "The first line of the country list, meaning no filter." },
  { key: "courses.filter.level", value: "Qualification level", group: "courses", label: "Level list", help: "The label above the qualification list on the courses page." },
  { key: "courses.filter.level_any", value: "All levels", group: "courses", label: "Level list, nothing chosen", help: "The first line of the qualification list, meaning no filter." },
  { key: "courses.filter.category", value: "Category", group: "courses", label: "Category list", help: "The label above the category list on the courses page." },
  { key: "courses.filter.category_any", value: "All categories", group: "courses", label: "Category list, nothing chosen", help: "The first line of the category list, meaning no filter." },
  { key: "courses.filter.institution", value: "Institution", group: "courses", label: "Institution list", help: "The label above the institution list on the courses page." },
  { key: "courses.filter.institution_any", value: "All institutions", group: "courses", label: "Institution list, nothing chosen", help: "The first line of the institution list, meaning no filter." },
  { key: "courses.filter.intake", value: "Intake", group: "courses", label: "Intake list", help: "The label above the intake month list on the courses page." },
  { key: "courses.filter.intake_any", value: "Any intake", group: "courses", label: "Intake list, nothing chosen", help: "The first line of the intake list, meaning no filter." },
  { key: "courses.filter.apply", value: "Apply filters", group: "courses", label: "Filter button", help: "The button that runs the search on the courses page." },
  { key: "courses.filter.clear", value: "Clear all", group: "courses", label: "Clear filters chip", help: "The chip that removes every filter at once." },
  { key: "courses.filter.remove", value: "Remove filter {name}", group: "courses", label: "Remove one filter", help: "Read aloud for each filter chip. Write {name} where the filter should go." },
];

const pageRows: StringRow[] = [
  { key: "courses.hero.badge", value: "Courses", group: "courses", label: "Courses page badge", help: "The small pill at the top of the courses page." },
  { key: "courses.hero.title", value: "Find a course", group: "courses", label: "Courses page heading", help: "The main heading at the top of the courses page." },
  { key: "courses.hero.lead", value: "Filter by destination, qualification level, category, institution and intake.", group: "courses", label: "Courses page intro", help: "The line under that heading." },
  { key: "courses.institution.badge", value: "Institution", group: "courses", label: "Institution block badge", help: "The small pill above the institution shown on a course page." },
  { key: "courses.requirements.title", value: "Entry requirements", group: "courses", label: "Entry requirements heading", help: "Sits above the entry requirements on a course page." },

  { key: "institutions.hero.badge", value: "Institutions", group: "institutions", label: "Institutions page badge", help: "The small pill at the top of the institutions page." },
  { key: "institutions.hero.title", value: "Universities and colleges we work with", group: "institutions", label: "Institutions page heading", help: "The main heading at the top of the institutions page." },
  { key: "institutions.courses.badge", value: "Courses", group: "institutions", label: "Courses block badge", help: "The small pill above the course list on an institution page." },
  { key: "institutions.partner_badge", value: "Partner institution", group: "institutions", label: "Partner label", help: "Shown on an institution we represent directly." },

  { key: "news.hero.badge", value: "News and updates", group: "news", label: "News page badge", help: "The small pill at the top of the news page, and of a category or tag page." },
  { key: "news.hero.title", value: "Study abroad insights and visa tips", group: "news", label: "News page heading", help: "The main heading at the top of the news page." },
  { key: "news.more.title", value: "More articles", group: "news", label: "More articles heading", help: "Sits above the other articles at the foot of an article." },

  { key: "events.hero.badge", value: "Events", group: "events", label: "Events page badge", help: "The small pill at the top of the events page." },
  { key: "events.hero.title", value: "Seminars, fairs and information sessions", group: "events", label: "Events page heading", help: "The main heading at the top of the events page." },
  { key: "events.online.title", value: "This event runs online", group: "events", label: "Online event heading", help: "Shown in place of a map when an event has no venue." },
  { key: "events.register.title", value: "Register", group: "events", label: "Registration heading", help: "Sits above the registration form on an event page." },

  { key: "offices.credentials.title", value: "Credentials", group: "offices", label: "Credentials heading", help: "Sits above the registrations and memberships on an office page." },
  { key: "offices.services.badge", value: "What we do here", group: "offices", label: "Office services badge", help: "The small pill above the services list on an office page." },
  { key: "offices.services.title", value: "Services from this office", group: "offices", label: "Office services heading", help: "The heading above the services list on an office page." },
  { key: "offices.team.badge", value: "The team here", group: "offices", label: "Office team badge", help: "The small pill above the staff photos on an office page." },
  { key: "offices.contact.badge", value: "Talk to us", group: "offices", label: "Office contact badge", help: "The small pill above the contact details on an office page." },

  { key: "about.team.lead", value: "We draw on our global network to assemble a team of experts.", group: "about", label: "Team page intro", help: "The line under the heading at the top of the team page." },
  { key: "about.offices.badge", value: "Our offices", group: "about", label: "Offices page badge", help: "The small pill at the top of the offices page." },
  { key: "about.offices.page_title", value: "Where to find us", group: "about", label: "Offices page heading", help: "The main heading at the top of the offices page." },
  { key: "about.csr.badge", value: "Corporate social responsibility", group: "about", label: "Responsibility page badge", help: "The small pill at the top of the corporate social responsibility page." },
  { key: "about.csr.title", value: "Community and sport", group: "about", label: "Responsibility page heading", help: "The main heading at the top of that page." },
  { key: "about.careers.badge", value: "Careers", group: "about", label: "Careers page badge", help: "The small pill at the top of the careers page." },
  { key: "about.careers.title", value: "Climb your career ladder with Goodluck", group: "about", label: "Careers page heading", help: "The main heading at the top of the careers page." },
  { key: "about.careers.lead", value: "We hold your efforts in high regard.", group: "about", label: "Careers page intro", help: "The line under that heading." },
  { key: "about.careers.life.badge", value: "Working here", group: "about", label: "Working here badge", help: "The small pill above the photos further down the careers page." },
  { key: "about.careers.life.title", value: "Discover the excellence of Goodluck", group: "about", label: "Working here heading", help: "The heading above those photos." },
  { key: "about.careers.voices.title", value: "Time to tune in to what our crew has to spill", group: "about", label: "Staff voices heading", help: "The heading above the staff videos on the careers page." },
  { key: "about.video.title", value: "Inside Goodluck Education and Migration", group: "about", label: "About video title", help: "Read aloud for the video on the About page." },

  { key: "search.hero.badge", value: "Search", group: "search", label: "Search page badge", help: "The small pill at the top of the search page." },

  { key: "testprep.hero.badge", value: "Test preparation", group: "testprep", label: "Test preparation badge", help: "The small pill at the top of the test preparation and batches pages." },
  { key: "testprep.hero.title", value: "Test preparation", group: "testprep", label: "Test preparation heading", help: "The main heading at the top of the test preparation page." },
  { key: "testprep.batches.badge", value: "Batches", group: "testprep", label: "Batches badge", help: "The small pill above a batch table." },
  { key: "testprep.batches.title", value: "Upcoming batches", group: "testprep", label: "Batches heading", help: "The heading above a batch table." },
  { key: "testprep.faqs.title", value: "Common questions", group: "testprep", label: "Questions heading", help: "The heading above the questions on the test preparation page." },
  { key: "testprep.syllabus.badge", value: "Syllabus", group: "testprep", label: "Syllabus badge", help: "The small pill above what an IELTS or PTE course covers." },
  { key: "testprep.syllabus.title", value: "What the course covers", group: "testprep", label: "Syllabus heading", help: "The heading above what an IELTS or PTE course covers." },

  { key: "team.qualifications.title", value: "Qualifications", group: "team", label: "Qualifications heading", help: "Sits above a staff member's qualifications on their page." },
  { key: "team.expertise.title", value: "Areas of expertise", group: "team", label: "Expertise heading", help: "Sits above what a staff member handles, on their page." },

  { key: "preview.lead", value: "This is a preview. Only signed-in staff can see it, and search engines are told to ignore it.", group: "system", label: "Preview banner", help: "Shown to staff previewing a draft. Visitors never see it." },
];

const lastRows: StringRow[] = [
  { key: "home.partners.badge", value: "Our partners", group: "home", label: "Partner strip badge", help: "The pill above the drifting row of partner logos." },
  { key: "home.partners.logo_alt", value: "Partner logo", group: "home", label: "Partner logo description", help: "Read aloud for each logo in that row. Not seen on screen." },

  { key: "about.profile.badge", value: "Company profile", group: "about", label: "Company profile badge", help: "The pill above the heading on the company profile page." },
  { key: "about.profile.title", value: "Company profile", group: "about", label: "Company profile heading", help: "The main heading on the company profile page." },
  { key: "about.profile.lead", value: "Goodluck Education and Migration strives to give excellent services and guidance to our clients, we understand the value of client support and aim to always provide reliable information.", group: "about", label: "Company profile intro", help: "The sentence under that heading. An intro typed on the page record in Pages wins over this." },
  { key: "about.profile.details_title", value: "Company details", group: "about", label: "Company details heading", help: "Above the registered name, founding year, email and website." },
  { key: "about.profile.label_name", value: "Registered name", group: "about", label: "Registered name label", help: "Label beside the company name." },
  { key: "about.profile.label_founded", value: "Established", group: "about", label: "Established label", help: "Label beside the founding year." },
  { key: "about.profile.label_email", value: "Email", group: "about", label: "Email label", help: "Label beside the company email address." },
  { key: "about.profile.label_website", value: "Website", group: "about", label: "Website label", help: "Label beside the website address." },
  { key: "about.profile.offices_title", value: "Offices", group: "about", label: "Offices heading", help: "Above the list of offices on the company profile page." },

  { key: "search.hero.title", value: "Search", group: "search", label: "Search page heading", help: "The heading on the search page before anything has been searched for." },
  { key: "search.hero.lead", value: "Courses, institutions, destinations, services, events and news.", group: "search", label: "Search page intro", help: "The line under that heading before anything has been searched for." },
  { key: "search.results.title", value: "Results for \u201c{q}\u201d", group: "search", label: "Results heading", help: "The heading once a search has run. Write {q} where the words searched for should go." },
  { key: "search.results.count", value: "{count} matches across the site.", group: "search", label: "Results count", help: "The line under that heading. Write {count} where the number should go." },
  { key: "search.results.count_one", value: "1 match across the site.", group: "search", label: "Results count, one match", help: "Used instead of the line above when exactly one thing matched." },
  { key: "search.field.label", value: "Search", group: "search", label: "Search box", help: "The label above the search box." },
  { key: "search.field.hint", value: "Course, institution, country or keyword", group: "search", label: "Search box hint", help: "The grey wording inside the empty search box." },
  { key: "search.field.submit", value: "Search", group: "search", label: "Search button", help: "The button beside the search box." },
];

const strayRows: StringRow[] = [
  { key: "offices.contact.title", value: "Book a consultation in {city}", group: "offices", label: "Office booking heading", help: "The heading at the foot of an office page. Write {city} where the city name should go." },
  { key: "testprep.batches.cta", value: "See the batch dates", group: "testprep", label: "Batch dates button", help: "The button under the batches panel on the test preparation page." },
  { key: "preview.no_body", value: "This record has no body text yet. Everything else about it is on its admin screen.", group: "system", label: "Preview with no body", help: "Shown to staff previewing a record that has no article text. Visitors never see it." },
];
