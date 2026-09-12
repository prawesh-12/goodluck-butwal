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
import { Banknote, Briefcase, BriefcaseBusiness, Building2, CalendarDays, Clock, FileText, Globe, Landmark, Link as LinkIcon, Mail, MapPin, Phone, Receipt, UserRound, Users, type LucideIcon } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/company-profile",
    title: "Company profile",
    description: company.tagline,
  });
}

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const Icon = ({ icon: I, className = "" }: { icon: LucideIcon; className?: string }) => <I size={16} strokeWidth={1.8} aria-hidden className={`shrink-0 ${className}`} />;

const Detail = ({ icon, center, className = "", children }: { icon: LucideIcon; center?: boolean; className?: string; children: ReactNode }) => (
  <span className={`flex gap-2 ${center ? "items-center" : "items-start"} ${className}`}>
    <Icon icon={icon} className={center ? "text-muted" : "mt-[2px] text-muted"} />
    <span className="min-w-0">{children}</span>
  </span>
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

  type Row = { label: string; value: ReactNode; icon: LucideIcon; strong?: boolean };
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: t("about.profile.group_registration", "Registration"),
      rows: [
        { label: t("about.profile.label_name", "Name of the company"), value: company.name, icon: Building2, strong: true },
        { label: t("about.profile.label_type", "Type"), value: profile?.type, icon: BriefcaseBusiness },
        { label: t("about.profile.label_authority", "Registration authority"), value: profile?.registration_authority, icon: Landmark },
        { label: t("about.profile.label_registration", "Company registration no."), value: profile?.registration_no, icon: FileText, strong: true },
        { label: t("about.profile.label_vat", "VAT no."), value: profile?.vat_no, icon: Receipt, strong: true },
        { label: t("about.profile.label_bank", "Official bank"), value: profile?.bank, icon: Banknote },
        { label: t("about.profile.label_associations", "Associated with"), value: profile?.associations, icon: Users },
      ],
    },
    {
      title: t("about.profile.group_business", "Business"),
      rows: [
        { label: t("about.profile.label_business", "Nature of business"), value: services.map((s) => s.name).join(", "), icon: Briefcase, strong: true },
        { label: t("about.profile.label_experience", "Working experience"), value: about.established, icon: CalendarDays },
        { label: t("about.profile.label_operated", "Operated and promoted by"), value: `${about.founders} (${t("about.founders.role", "Co-founders").toLowerCase()}) with a team of ${team.length}`, icon: UserRound },
        {
          label: t("about.profile.label_countries", "We recruit students in"),
          icon: Globe,
          value: (
            <span className="flex flex-wrap gap-x-4 gap-y-2">
              {destinations.map((d) => (
                <span key={d.slug} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Img src={d.flag} alt="" w={48} className="size-5 rounded-full ring-2 ring-white" loading="lazy" decoding="async" />
                  {d.name}
                </span>
              ))}
            </span>
          ),
        },
      ],
    },
    {
      title: t("about.profile.group_contact", "Contact"),
      rows: [
        { label: t("about.profile.label_email", "E-mail"), icon: Mail, value: <a href={`mailto:${company.email}`} className="underline underline-offset-4">{company.email}</a> },
        {
          label: t("about.profile.label_website", "Website"),
          icon: LinkIcon,
          value: (
            <span className="flex flex-wrap gap-x-5 gap-y-1">
              {[company.url, ...social.map((s) => s.href)].map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">{host(url)}</a>
              ))}
            </span>
          ),
        },
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
          <div className="flex flex-col gap-[60px] md:gap-20 lg:gap-[100px]">
            <div className="flex flex-col gap-[30px] md:gap-10">
              <SectionHead align="left" title={t("about.profile.details_title", "Company details")} />
              <div className="flex w-full flex-col gap-5 md:gap-[30px]">
                {groups.map((group, i) => (
                  <Appear key={group.title} delay={0.05 * i} className="grid gap-5 rounded-[20px] bg-surface p-5 md:rounded-[24px] md:p-[30px] lg:grid-cols-[300px_1fr] lg:gap-[60px] lg:p-10">
                    <h3 className="t-h3">{group.title}</h3>
                    <dl className="divide-y divide-hairline">
                      {group.rows.map((row) => (
                        <div key={row.label} className="grid gap-2 py-5 first:pt-0 last:pb-0 md:grid-cols-[240px_1fr] md:gap-[30px]">
                          <dt className="t-base flex items-start gap-2 text-muted">
                            <Icon icon={row.icon} className="mt-[2px]" />
                            {row.label}
                          </dt>
                          <dd className={`t-body max-w-[640px] text-ink ${row.strong ? "font-semibold" : ""}`}>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Appear>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[30px] md:gap-10">
              <SectionHead align="left" title={t("about.profile.offices_title", "Offices")} />
              <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
                {offices.map((office, i) => (
                  <Appear key={office.id} delay={0.05 * i} className="flex flex-col gap-5 rounded-[20px] bg-surface p-5 md:rounded-[24px] md:p-6">
                    <span className="flex items-center gap-3">
                      <Img src={office.flag} alt="" w={64} className="size-8 shrink-0 rounded-full ring-2 ring-white" loading="lazy" decoding="async" />
                      <span className="flex flex-col">
                        <span className="t-body font-semibold text-ink">{office.label}</span>
                        <span className="t-small text-muted">{office.city}, {office.country}</span>
                      </span>
                    </span>
                    <span className="t-base flex flex-col gap-[10px]">
                      <Detail icon={MapPin}>
                        <address className="not-italic text-muted">{office.address}</address>
                      </Detail>
                      <Detail icon={Phone}>
                        <a href={office.tel} className="text-ink underline underline-offset-4">{office.phone}</a>
                      </Detail>
                      {office.hours && (
                        <Detail icon={Clock}>
                          <span className="text-muted">{office.hours}</span>
                        </Detail>
                      )}
                    </span>
                  </Appear>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[30px] md:gap-10">
              <SectionHead align="left" title={t("about.profile.staff_title", "Staff")} lead={`${team.length} ${t("about.profile.staff_lead", "team members: {offices}").replace("{offices}", headcount)}`} />
              <Appear className="w-full overflow-x-auto rounded-[20px] ring-1 ring-hairline md:rounded-[24px]">
                <table className="block w-full border-collapse text-left md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-surface">
                      <th className="t-small px-6 py-3 font-medium text-muted">{t("about.profile.col_name", "Name")}</th>
                      <th className="t-small px-6 py-3 font-medium text-muted">{t("about.profile.col_position", "Position")}</th>
                      <th className="t-small px-6 py-3 font-medium text-muted">{t("about.profile.col_office", "Office")}</th>
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-hairline md:table-row-group">
                    {staff.map((member) => {
                      const office = officeOf(member.office);
                      return (
                        <tr key={member.slug} className="block py-3 md:table-row md:py-0">
                          <td className="block px-4 md:table-cell md:px-6 md:py-3 md:align-middle">
                            <Link href={`/team/${member.slug}`} className="t-base flex items-center gap-3 font-semibold text-ink underline-offset-4 hover:underline">
                              <Img src={member.photo} alt="" w={80} className="size-10 shrink-0 rounded-full object-cover object-top" loading="lazy" decoding="async" />
                              {member.name}
                            </Link>
                          </td>
                          <td className="t-base block pl-[68px] pr-4 pt-[2px] text-muted md:table-cell md:px-6 md:py-3 md:align-middle">{member.role}</td>
                          <td className="t-base block pl-[68px] pr-4 pt-1 text-muted md:table-cell md:px-6 md:py-3 md:align-middle">
                            {office && (
                              <Detail icon={MapPin} center>
                                {office.city}, {office.country}
                              </Detail>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Appear>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
