import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { CheckRow } from "@/components/ui/bits";
import { InnerHero, SectionHead, TeamCard } from "@/components/inner";
import { OfficeContactCards } from "@/components/contact-cards";
import { getOfficeProfile, listOfficeProfiles, listOffices, listServiceLinks } from "@/server/queries/offices";
import { listTeam } from "@/server/queries/people";
import { loadText } from "@/server/queries/text";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export const generateStaticParams = async () => (await listOfficeProfiles()).map((o) => ({ slug: o.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const office = await getOfficeProfile((await params).slug);
  return office
    ? { title: `${office.city}, ${office.country}`, description: office.address }
    : { title: "Office" };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekOrder = (day: number) => (day + 6) % 7;

export default async function OfficePage({ params }: Props) {
  const t = await loadText();
  const { slug } = await params;
  const office = await getOfficeProfile(slug);
  if (!office) notFound();

  const [allOffices, team, services] = await Promise.all([listOffices(), listTeam(), listServiceLinks()]);
  const staff = team.filter((m) => m.office === office.id);
  const hours = [...(office.openingHours ?? [])].sort((a, b) => weekOrder(a.day) - weekOrder(b.day));
  const mapsLink =
    office.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.address}, ${office.city}, ${office.country}`)}`;

  return (
    <>
      <InnerHero badge={office.label} title={`${office.city}, ${office.country}`} lead={office.address} />

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
              <Appear className="flex flex-col gap-5">
                <OfficeContactCards offices={allOffices} />
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {office.email && (
                    <a href={`mailto:${office.email}`} className="t-base font-semibold text-ink underline underline-offset-4">
                      {office.email}
                    </a>
                  )}
                  <a href={mapsLink} target="_blank" rel="noopener" className="t-base font-semibold text-ink underline underline-offset-4">
                    {t("contact.offices.maps_link", "Open in Maps")}
                  </a>
                </div>
              </Appear>
              {office.mapsEmbedUrl?.startsWith("https://") && (
                <Appear delay={0.1} className="min-h-[320px] overflow-clip rounded-[10px] md:rounded-[20px]">
                  <iframe
                    title={`Map to the ${office.label} in ${office.city}`}
                    src={office.mapsEmbedUrl}
                    className="size-full min-h-[320px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </Appear>
              )}
            </div>

            {hours.length > 0 && (
              <div className="article article-scroll w-full max-w-[800px]">
                <table>
                  <caption className="t-small pb-[10px] text-left text-muted">
                    Opening hours, local to {office.city} ({office.timezone}).
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Day</th>
                      <th scope="col">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((h) => (
                      <tr key={h.day}>
                        <th scope="row">{DAYS[h.day]}</th>
                        <td>{h.closed ? "Closed" : `${h.open} to ${h.close}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {office.profileHtml && (
              <div className="article article-scroll w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: office.profileHtml }} />
            )}

            {office.credentialsHtml && (
              <div className="flex w-full max-w-[800px] flex-col gap-[30px]">
                <SectionHead align="left" title={t("offices.credentials.title", "Credentials")} />
                <div className="article article-scroll w-full" dangerouslySetInnerHTML={{ __html: office.credentialsHtml }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="pb-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead badge={t("offices.services.badge", "What we do here")} title={t("offices.services.title", "Services from this office")} />
              <div className="grid w-full max-w-[800px] gap-[10px] md:grid-cols-2">
                {services.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`} className="rounded-[10px] bg-surface p-4 md:p-5">
                    <CheckRow color="text-ink">{s.name}</CheckRow>
                    {s.summary && <p className="t-small pl-3 pt-[6px] text-muted">{s.summary}</p>}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {staff.length > 0 && (
        <section className="pb-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead badge={t("offices.team.badge", "The team here")} title={`Our people in ${office.city}`} />
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[30px] md:gap-y-10 lg:grid-cols-4">
                {staff.map((m, i) => (
                  <TeamCard key={m.slug} name={m.name} role={m.role} photo={m.photo} delay={Math.min(i * 0.04, 0.4)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px]">
            <SectionHead badge={t("offices.contact.badge", "Talk to us")} title={t("offices.contact.title", "Book a consultation in {city}").replace("{city}", office.city)} />
            <PillButton href="/contact/book-consultation" tone="dark">
              {t("nav.book_cta", "Book a consultation")}
            </PillButton>
          </div>
        </div>
      </section>
    </>
  );
}
