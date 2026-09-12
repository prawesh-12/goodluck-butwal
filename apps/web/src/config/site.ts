// The one source for addresses, phones and emails. Do not type one anywhere else.
export const company = {
  name: "Goodluck Education & Migration",
  short: "Goodluck",
  founded: 2022,
  email: "info@goodluck.services",
  url: "https://goodluck.services",
  tagline:
    "Goodluck Education and Migration strives to give excellent services and guidance to our clients, we understand the value of client support and aim to always provide reliable information.",
};

export type OfficeId = "au" | "np" | "ph";

export type Office = {
  id: OfficeId;
  country: string;
  city: string;
  label: string;
  address: string;
  phone: string;
  tel: string;
  primary: boolean;
  hours?: string;
  flag: string;
};

export const offices: Office[] = [
  {
    id: "au",
    country: "Australia",
    city: "Melbourne",
    label: "Head Office",
    address: "Suite 1.01, Level 1, 2 Queen St, Melbourne VIC",
    phone: "(03) 9466 4783",
    tel: "tel:0394664783",
    primary: true,
    flag: "/images/flags/australia.svg",
  },
  {
    id: "np",
    country: "Nepal",
    city: "Butwal",
    label: "Nepal Office",
    address: "Milanchowk, Butwal",
    phone: "071-560460",
    tel: "tel:+977071560460",
    primary: true,
    hours: "Mon - Fri: 10 am to 5 pm",
    flag: "/images/flags/nepal.svg",
  },
  {
    id: "ph",
    country: "Philippines",
    city: "Cebu",
    label: "Philippines Office",
    address: "Unit M110 G Floor, NDI Commercial Complex Annex Bldg, A.S. Fortuna St., Mandaue City, Cebu 6014",
    phone: "(032) 263-2235",
    tel: "tel:+0322632235",
    primary: false,
    flag: "/images/flags/philippines.svg",
  },
];

export const officeById = (id: OfficeId) => offices.find((o) => o.id === id)!;

export const social = [
  { label: "Facebook", href: "#", icon: "/images/social/facebook.webp" },
  { label: "Instagram", href: "#", icon: "/images/social/instagram.webp" },
];

// menuOnly: listed in the mobile menu but kept out of the header bar so it stays readable.
export const nav = [
  { label: "About", href: "/about" },
  { label: "Study abroad", href: "/study-abroad" },
  { label: "Institutions", href: "/institutions", menuOnly: true },
  { label: "Services", href: "/services" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events", menuOnly: true },
  { label: "Contact", href: "/contact" },
  { label: "Search", href: "/search", menuOnly: true },
];

export const footerLinks = {
  Company: [
    { label: "About us", href: "/about" },
    { label: "Our team", href: "/about/team" },
    { label: "Social responsibility", href: "/about/corporate-social-responsibility" },
    { label: "Careers", href: "/about/careers" },
    { label: "Company profile", href: "/company-profile" },
  ],
  Countries: [
    { label: "Australia", href: "/study-abroad/australia" },
    { label: "New Zealand", href: "/study-abroad#new-zealand" },
    { label: "United Kingdom", href: "/study-abroad/united-kingdom" },
  ],
  Support: [
    { label: "Services", href: "/services" },
    { label: "Success stories", href: "/success-stories" },
    { label: "FAQ", href: "/faq" },
    { label: "Search", href: "/search" },
    { label: "News", href: "/news" },
    { label: "Contact", href: "/contact" },
    { label: "Book a consultation", href: "/contact/book-consultation" },
  ],
};
