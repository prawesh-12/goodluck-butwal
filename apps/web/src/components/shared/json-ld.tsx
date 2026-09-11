import { toJsonLd, type Schema } from "@/lib/seo/schema";

export function JsonLd({ data }: { data: Schema | Schema[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />;
}
