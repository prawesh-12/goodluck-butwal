import { absoluteUrl } from "@/lib/seo";
import { company } from "@/config/site";

export type Schema = Record<string, unknown>;

// A raw "<" would close the script tag the JSON is printed inside.
export function toJsonLd(data: Schema | Schema[]) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

const ORGANIZATION_ID = `${company.url}/#organization`;

export function organization(socials: string[] = []): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: company.name,
    url: company.url,
    logo: absoluteUrl("/brand/logo.png"),
    email: company.email,
    description: company.tagline,
    foundingDate: String(company.founded),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

export function webSite(): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${company.url}/#website`,
    name: company.name,
    url: company.url,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type OfficeSchemaInput = {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  hours?: string;
};

export function localBusiness(office: OfficeSchemaInput): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${company.name} ${office.name}`,
    url: absoluteUrl("/contact"),
    parentOrganization: { "@id": ORGANIZATION_ID },
    address: {
      "@type": "PostalAddress",
      streetAddress: office.address,
      addressLocality: office.city,
      addressCountry: office.country,
    },
    ...(office.phone ? { telephone: office.phone } : {}),
    ...(office.hours ? { openingHours: office.hours } : {}),
  };
}

export type ArticleSchemaInput = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
};

export function article(post: ArticleSchemaInput): Schema {
  const url = absoluteUrl(`/news/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    ...(post.image ? { image: absoluteUrl(post.image) } : {}),
    ...(post.date ? { datePublished: post.date } : {}),
    url,
    mainEntityOfPage: url,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type EventSchemaInput = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  startsAt: Date;
  endsAt: Date | null;
  isOnline: boolean;
  onlineUrl: string | null;
  venueName: string | null;
  venueAddress: string | null;
  officeName: string;
};

export function event(input: EventSchemaInput): Schema {
  const url = absoluteUrl(`/events/${input.slug}`);
  const location = input.isOnline
    ? { "@type": "VirtualLocation", url: input.onlineUrl ?? url }
    : {
        "@type": "Place",
        name: input.venueName ?? input.officeName,
        ...(input.venueAddress ? { address: input.venueAddress } : {}),
      };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description: input.summary,
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    startDate: input.startsAt.toISOString(),
    ...(input.endsAt ? { endDate: input.endsAt.toISOString() } : {}),
    eventAttendanceMode: input.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location,
    url,
    organizer: { "@id": ORGANIZATION_ID },
  };
}

export type CourseSchemaInput = {
  path: string;
  name: string;
  description: string;
  provider: string;
};

export function course(input: CourseSchemaInput): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: absoluteUrl(input.path),
    provider: { "@type": "Organization", name: input.provider },
  };
}

export function faqPage(items: { q: string; a: string }[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
