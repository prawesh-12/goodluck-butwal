import type { MetadataRoute } from "next";
import { company } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${company.url}/sitemap.xml`,
  };
}
