import type { Metadata } from "next";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { db } from "@db/client";
import { pages } from "@db/schema";
import { company } from "@/config/site";
import { listOffices } from "@/features/offices/queries";
import { loadText } from "@/features/site-text/queries";
import { Appear } from "@/components/ui/appear";
import { InnerHero, SectionHead } from "@/components/shared/inner";
import { Img } from "@/components/ui/img";

// Registered particulars are not in this repo, so the body is admin-editable. Everything else
// comes from the office table and the company record.
const getProfileBody = cache(async () => {
  const [row] = await db
    .select({ intro: pages.intro, bodyHtml: pages.bodyHtml })
    .from(pages)
    .where(and(eq(pages.slug, "company-profile"), eq(pages.parent, "about"), eq(pages.status, "published")));
  return row;
});

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/about/company-profile",
    title: "Company profile",
  });
}

export default async function CompanyProfilePage() {
  const [t, offices, body] = await Promise.all([loadText(), listOffices(), getProfileBody()]);

  const details = [
    { label: t("about.profile.label_name", "Registered name"), value: company.name },
    { label: t("about.profile.label_founded", "Established"), value: String(company.founded) },
    { label: t("about.profile.label_email", "Email"), value: company.email },
    { label: t("about.profile.label_website", "Website"), value: company.url.replace(/^https:\/\//, "") },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "About us", path: "/about" },
          { name: t("about.profile.title", "Company profile"), path: "/about/company-profile" },
        ])}
      />
      <InnerHero
        badge={t("about.profile.badge", "Company profile")}
        title={t("about.profile.title", "Company profile")}
        lead={body?.intro ?? t("about.profile.lead", company.tagline)}
      />

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead align="left" title={t("about.profile.details_title", "Company details")} />
            <dl className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
              {details.map((row, i) => (
                <Appear key={row.label} delay={0.05 * i} className="flex flex-col gap-1 rounded-[20px] bg-surface p-5 md:rounded-[24px] md:p-6">
                  <dt className="t-small text-muted">{row.label}</dt>
                  <dd className="t-body text-ink">{row.value}</dd>
                </Appear>
              ))}
            </dl>

            <SectionHead align="left" title={t("about.profile.offices_title", "Offices")} />
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
              {offices.map((office, i) => (
                <Appear key={office.id} delay={0.05 * i} className="flex flex-col gap-[10px] rounded-[20px] bg-surface p-5 md:rounded-[24px] md:p-6">
                  <span className="flex items-center gap-2">
                    <Img src={office.flag} alt="" w={48} className="size-[22px] rounded-full ring-2 ring-white" loading="lazy" decoding="async" />
                    <span className="t-body font-semibold text-ink">{office.label}</span>
                  </span>
                  <address className="t-base not-italic text-muted">{office.address}</address>
                  <a href={office.tel} className="t-base text-ink underline underline-offset-4">{office.phone}</a>
                  {office.hours && <span className="t-small text-muted">{office.hours}</span>}
                </Appear>
              ))}
            </div>

            {body?.bodyHtml && (
              <div className="article w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: body.bodyHtml }} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
