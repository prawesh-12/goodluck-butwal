import type { MetadataRoute } from "next";
import { company } from "@/lib/site";
import { listServices } from "@/server/queries/services";
import { listDestinations } from "@/server/queries/destinations";
import { listArticles } from "@/server/queries/editorial";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, destinations, articles] = await Promise.all([
    listServices(),
    listDestinations(),
    listArticles(),
  ]);
  const fixed = ["", "/about", "/about/team", "/about/message-from-co-founders", "/about/corporate-social-responsibility", "/about/careers", "/study-abroad", "/services", "/success-stories", "/news", "/faq", "/contact", "/contact/book-consultation"];
  return [
    ...fixed.map((p) => ({ url: `${company.url}${p}`, changeFrequency: "monthly" as const })),
    ...destinations.map((d) => ({ url: `${company.url}/study-abroad/${d.slug}`, changeFrequency: "monthly" as const })),
    ...services.map((s) => ({ url: `${company.url}/services/${s.slug}`, changeFrequency: "monthly" as const })),
    ...articles.map((a) => ({ url: `${company.url}/news/${a.slug}`, lastModified: a.date, changeFrequency: "yearly" as const })),
  ];
}
