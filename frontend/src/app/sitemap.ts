import type { MetadataRoute } from "next";
import { company } from "@/lib/site";
import { services } from "@/content/services";
import { destinations } from "@/content/destinations";
import articles from "@/content/articles.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/about", "/about/team", "/about/message-from-co-founders", "/about/corporate-social-responsibility", "/about/careers", "/study-abroad", "/services", "/success-stories", "/news", "/faq", "/contact", "/contact/book-consultation"];
  return [
    ...fixed.map((p) => ({ url: `${company.url}${p}`, changeFrequency: "monthly" as const })),
    ...destinations.map((d) => ({ url: `${company.url}/study-abroad/${d.slug}`, changeFrequency: "monthly" as const })),
    ...services.map((s) => ({ url: `${company.url}/services/${s.slug}`, changeFrequency: "monthly" as const })),
    ...articles.map((a) => ({ url: `${company.url}/news/${a.slug}`, lastModified: a.date, changeFrequency: "yearly" as const })),
  ];
}
