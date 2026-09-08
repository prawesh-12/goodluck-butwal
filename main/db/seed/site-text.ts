import { db } from "../client";
import { settings, uiStrings } from "../schema";
import { footerLinks, social } from "../../src/lib/site";

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

export async function seedUiStrings() {
  const rows = [...footerRows(), ...homeRows, ...innerPageRows, ...errorRows, ...formRows];

  for (const row of rows) {
    await db
      .insert(uiStrings)
      .values(row)
      // Only the wording an admin has not touched is refreshed; the value is left alone.
      .onConflictDoUpdate({
        target: uiStrings.key,
        set: { label: row.label, help: row.help, group: row.group },
      });
  }
  return rows.length;
}

export async function seedSettings() {
  const rows = [
    {
      key: "social_links",
      value: social.map((s) => ({ label: s.label, href: s.href, icon: s.icon })),
    },
  ];

  for (const row of rows) {
    await db
      .insert(settings)
      .values(row)
      .onConflictDoNothing({ target: settings.key });
  }
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
  { key: "about.founders.title", value: "Message from co-founders", group: "about", label: "Co-founders section heading", help: "Heading above the co-founders panel on the About page." },
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

  { key: "empty.cta", value: "Book a free consultation", group: "errors", label: "Empty list button", help: "The button under every \u201cnothing here yet\u201d message, unless a page sets its own." },
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
