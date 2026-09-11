import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices, teamMembers } from "@db/schema";
import { listTeam } from "@/features/team/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { CheckRow, SocialLinks } from "@/components/ui/bits";
import { InnerHero } from "@/components/shared/inner";
import { loadText } from "@/features/site-text/queries";
import { Img } from "@/components/ui/img";

type Props = { params: Promise<{ slug: string }> };

// Its own row rather than widening listTeam(), which every other page runs.
const getMember = cache(async (slug: string) => {
  const [row] = await db
    .select({
      name: teamMembers.fullName,
      role: teamMembers.position,
      bioHtml: teamMembers.bioHtml,
      qualifications: teamMembers.qualifications,
      expertise: teamMembers.expertise,
      photo: mediaAssets.staticPath,
      city: offices.city,
      country: offices.country,
    })
    .from(teamMembers)
    .leftJoin(mediaAssets, eq(teamMembers.photoId, mediaAssets.id))
    .leftJoin(offices, eq(teamMembers.officeId, offices.id))
    .where(and(eq(teamMembers.slug, slug), eq(teamMembers.status, "published")))
    .limit(1);
  return row;
});

export const generateStaticParams = async () =>
  (await listTeam()).map((member) => ({ slug: member.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = await getMember((await params).slug);
  if (!member) return { title: "Our team" };
  const place = [member.city, member.country].filter(Boolean).join(", ");
  return {
    title: member.name,
    description: [member.role, place].filter(Boolean).join(" · ") || undefined,
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member) notFound();

  const place = [member.city, member.country].filter(Boolean).join(", ");
  const qualifications = member.qualifications ?? [];
  const expertise = member.expertise ?? [];
  const firstName = member.name.split(" ")[0];
  const t = await loadText();

  return (
    <>
      <InnerHero
        badge={place || "Our team"}
        badgeTone="chip"
        title={member.name}
        size="md"
        lead={member.role ?? undefined}
        clouds={false}
      />

      {member.photo && (
        <section className="flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <Appear className="mx-auto aspect-[345/400] w-full max-w-[420px] overflow-clip rounded-[10px] bg-surface md:rounded-[20px]">
              <Img src={member.photo} alt={member.name} sizes="(min-width: 810px) 420px, 100vw" w={840} className="size-full object-cover object-top" fetchPriority="high" decoding="async" />
            </Appear>
          </div>
        </section>
      )}

      {member.bioHtml && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <div className="article article-scroll w-full" dangerouslySetInnerHTML={{ __html: member.bioHtml }} />
          </div>
        </section>
      )}

      {(qualifications.length > 0 || expertise.length > 0) && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <div className="grid gap-[30px] md:grid-cols-2 md:gap-10">
              {qualifications.length > 0 && (
                <Appear className="flex flex-col gap-5">
                  <h2 className="t-h3">{t("team.qualifications.title", "Qualifications")}</h2>
                  <div className="flex flex-col gap-[10px]">
                    {qualifications.map((item) => <CheckRow key={item}>{item}</CheckRow>)}
                  </div>
                </Appear>
              )}
              {expertise.length > 0 && (
                <Appear delay={0.1} className="flex flex-col gap-5">
                  <h2 className="t-h3">{t("team.expertise.title", "Areas of expertise")}</h2>
                  <div className="flex flex-col gap-[10px]">
                    {expertise.map((item) => <CheckRow key={item}>{item}</CheckRow>)}
                  </div>
                </Appear>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <h2 className="t-h3">{t("cta.person.title", "Talk to {name}").replace("{name}", firstName)}</h2>
            <p className="t-body text-muted">{t("cta.person.lead", "Book a free consultation and we will put you with the right person for your case.")}</p>
            <SocialLinks />
            <PillButton href="/contact/book-consultation" tone="dark">{t("cta.consultation", "Book a free consultation")}</PillButton>
          </Appear>
        </div>
      </section>
    </>
  );
}
