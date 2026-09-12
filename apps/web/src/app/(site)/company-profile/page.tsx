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
  const officeRank = (id: string | null) => {
    const i = offices.findIndex((o) => o.id === id);
    return i < 0 ? offices.length : i;
  };
  const staff = [...team].sort((a, b) => officeRank(a.office) - officeRank(b.office));
  const headcount = offices.map((o) => `${o.city} ${team.filter((m) => m.office === o.id).length}`).join(", ");

  const groups: { title: string; rows: { label: string; value: ReactNode }[] }[] = [
    {
      title: t("about.profile.group_registration", "Registration"),
      rows: [
        { label: t("about.profile.label_name", "Name of the company"), value: company.name },
        { label: t("about.profile.label_type", "Type"), value: profile?.type },
        { label: t("about.profile.label_authority", "Registration authority"), value: profile?.registration_authority },
        { label: t("about.profile.label_registration", "Company registration no."), value: profile?.registration_no },
        { label: t("about.profile.label_vat", "VAT no."), value: profile?.vat_no },
        { label: t("about.profile.label_bank", "Official bank"), value: profile?.bank },
        { label: t("about.profile.label_associations", "Associated with"), value: profile?.associations },
      ],
    },
    {
      title: t("about.profile.group_business", "Business"),
      rows: [
        { label: t("about.profile.label_business", "Nature of business"), value: services.map((s) => s.name).join(", ") },
        { label: t("about.profile.label_experience", "Working experience"), value: about.established },
        { label: t("about.profile.label_operated", "Operated and promoted by"), value: `${about.founders} (${t("about.founders.role", "Co-founders").toLowerCase()}) with a team of ${team.length}` },
        { label: t("about.profile.label_countries", "We recruit students in"), value: destinations.map((d) => d.name).join(", ") },
      ],
    },
    {
      title: t("about.profile.group_contact", "Contact"),
      rows: [
        { label: t("about.profile.label_email", "E-mail"), value: company.email },
        { label: t("about.profile.label_website", "Website"), value: <Lines items={[company.url, ...social.map((s) => s.href)].map(host)} /> },
      ],
    },
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
            <div className="flex w-full flex-col gap-5 md:gap-[30px]">
              {groups.map((group, i) => (
                <Appear key={group.title} delay={0.05 * i} className="grid gap-5 rounded-[20px] bg-surface p-5 md:rounded-[24px] md:p-[30px] lg:grid-cols-[300px_1fr] lg:gap-[60px] lg:p-10">
                  <h3 className="t-h3">{group.title}</h3>
                  <dl className="divide-y divide-hairline">
                    {group.rows.map((row) => (
                      <div key={row.label} className="grid gap-1 py-4 first:pt-0 last:pb-0 md:grid-cols-[240px_1fr] md:gap-[30px] md:py-5">
                        <dt className="t-base text-muted">{row.label}</dt>
                        <dd className="t-body text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Appear>
              ))}
            </div>

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

            <SectionHead align="left" title={t("about.profile.staff_title", "Staff")} lead={`${team.length} ${t("about.profile.staff_lead", "team members: {offices}").replace("{offices}", headcount)}`} />
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
                  {staff.map((member) => {
                    const office = officeOf(member.office);
                    return (
                      <tr key={member.slug}>
                        <td>
                          <Link href={`/team/${member.slug}`} className="flex items-center gap-3 whitespace-nowrap">
                            <Img src={member.photo} alt="" w={80} className="m-0! size-10 shrink-0 rounded-full! object-cover object-top" loading="lazy" decoding="async" />
                            {member.name}
                          </Link>
                        </td>
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
