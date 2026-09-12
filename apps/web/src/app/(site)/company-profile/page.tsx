import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { company } from "@/config/site";
import { getAboutContent, getCompanyProfile } from "@/features/pages/queries";
import { listOffices, listServiceLinks } from "@/features/offices/queries";
import { listDestinations } from "@/features/destinations/queries";
import { listTeam } from "@/features/team/queries";
import { getSocialLinks } from "@/features/settings/queries";
import { loadText } from "@/features/site-text/queries";
import { Appear } from "@/components/ui/appear";
import { Link } from "@/components/ui/link";
import { InnerHero, SectionHead } from "@/components/shared/inner";
import { Img } from "@/components/ui/img";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/company-profile",
    title: "Company profile",
    description: company.tagline,
  });
}

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const Lines = ({ items }: { items: string[] }) => (
  <>
    {items.map((line) => (
      <span key={line} className="block">{line}</span>
    ))}
  </>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-[22px]">
    {items.map((line) => (
      <li key={line}>{line}</li>
    ))}
  </ul>
);

export default async function CompanyProfilePage() {
  const [t, offices, services, destinations, team, social, about, profile] = await Promise.all([
    loadText(),
    listOffices(),
    listServiceLinks(),
    listDestinations(),
    listTeam(),
    getSocialLinks(),
    getAboutContent(),
    getCompanyProfile(),
  ]);

  const officeOf = (id: string | null) => offices.find((o) => o.id === id);

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("about.profile.label_name", "Name of the company"), value: company.name },
    { label: t("about.profile.label_type", "Type"), value: profile?.type },
    { label: t("about.profile.label_address", "Address"), value: <Lines items={offices.map((o) => `${o.label}: ${o.address}`)} /> },
    { label: t("about.profile.label_phone", "Contact no."), value: <Lines items={offices.map((o) => `${o.city}: ${o.phone}`)} /> },
    { label: t("about.profile.label_email", "E-mail"), value: company.email },
    { label: t("about.profile.label_website", "Website"), value: [company.url, ...social.map((s) => s.href)].map(host).join(" / ") },
    { label: t("about.profile.label_authority", "Registration authority"), value: profile?.registration_authority },
    { label: t("about.profile.label_registration", "Company registration no."), value: profile?.registration_no },
    { label: t("about.profile.label_vat", "VAT no."), value: profile?.vat_no },
    { label: t("about.profile.label_bank", "Official bank"), value: profile?.bank },
    { label: t("about.profile.label_business", "Nature of business"), value: services.map((s) => s.name).join(", ") },
    { label: t("about.profile.label_experience", "Working experience"), value: about.established },
    { label: t("about.profile.label_mission", "Mission statement"), value: about.mission },
    { label: t("about.profile.label_vision", "Vision statement"), value: about.vision },
    { label: t("about.profile.label_strategies", "Strategies"), value: <Bullets items={profile?.strategies ?? []} /> },
    { label: t("about.profile.label_activities", "Profile of activities"), value: about.coFounderSummary.join(" ") },
    { label: t("about.profile.label_networking", "Networking"), value: `${t("about.stats.partners.value", "100+")} ${t("about.stats.partners.text", "Colleges, institutions, universities and TAFE facilities we represent.")}` },
    { label: t("about.profile.label_facilities", "Facilities and activities"), value: profile?.facilities },
    { label: t("about.profile.label_services", "We provide students the following services"), value: <Bullets items={services.map((s) => `${s.name}: ${s.summary}`)} /> },
    { label: t("about.profile.label_operated", "Operated and promoted by"), value: `${about.founders} (${t("about.founders.role", "Co-founders").toLowerCase()}) with a team of ${team.length}` },
    { label: t("about.profile.label_associations", "Associated with"), value: profile?.associations },
    { label: t("about.profile.label_countries", "We recruit students in"), value: destinations.map((d) => d.name).join(", ") },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbs([
          { name: "Home", path: "/" },
          { name: t("about.profile.title", "Company profile"), path: "/company-profile" },
        ])}
      />
      <InnerHero
        badge={t("about.profile.badge", "Company profile")}
        title={t("about.profile.title", "Company profile")}
        lead={profile?.intro ?? t("about.profile.lead", company.tagline)}
      />

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead align="left" title={t("about.profile.details_title", "Company details")} />
            <Appear className="w-full overflow-clip rounded-[20px] bg-surface md:rounded-[24px]">
              <dl className="divide-y divide-hairline">
                {rows.map((row) => (
                  <div key={row.label} className="grid gap-1 p-5 md:grid-cols-[260px_1fr] md:gap-[30px] md:p-6">
                    <dt className="t-base font-semibold text-ink">{row.label}</dt>
                    <dd className="t-body text-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Appear>

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

            <SectionHead align="left" title={t("about.profile.staff_title", "Staff")} lead={t("about.profile.staff_lead", "Every team member, with their position and office.")} />
            <Appear className="article article-scroll w-full">
              <table>
                <thead>
                  <tr>
                    <th>{t("about.profile.col_name", "Name")}</th>
                    <th>{t("about.profile.col_position", "Position")}</th>
                    <th>{t("about.profile.col_office", "Office")}</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => {
                    const office = officeOf(member.office);
                    return (
                      <tr key={member.slug}>
                        <td><Link href={`/team/${member.slug}`}>{member.name}</Link></td>
                        <td>{member.role}</td>
                        <td>{office ? `${office.city}, ${office.country}` : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
