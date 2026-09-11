import type { Metadata } from "next";
import { Link } from "@/components/ui/link";
import { InfoCard, InnerHero } from "@/components/shared/inner";
import { listOfficeProfiles } from "@/features/offices/queries";
import { loadText } from "@/features/site-text/queries";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const offices = await listOfficeProfiles();
  return {
    title: "Our offices",
    description: offices.map((o) => `${o.city}, ${o.country}`).join(". "),
  };
}

export default async function AboutOfficesPage() {
  const t = await loadText();
  const offices = await listOfficeProfiles();
  const cities = offices.map((o) => o.city).filter(Boolean);

  return (
    <>
      <InnerHero
        badge={t("about.offices.badge", "Our offices")}
        title={t("about.offices.page_title", "Where to find us")}
        lead={cities.length ? `${cities.join(" and ")}.` : undefined}
      />
      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
            {offices.map((o, i) => (
              <Link key={o.id} href={`/offices/${o.slug}`} className="block">
                <InfoCard
                  label={o.label}
                  title={`${o.city}, ${o.country}`}
                  line={o.address}
                  tone={i === 0 ? "dark" : "surface"}
                  delay={0.1 * i}
                  className="h-full"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
