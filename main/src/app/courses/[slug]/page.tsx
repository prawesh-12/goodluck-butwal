import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getCourse, getInstitution } from "@/server/queries/catalogue";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/bits";
import { InfoCard, InnerHero, SectionHead } from "@/components/inner";
import { InstitutionCard } from "@/components/catalogue/institution-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return buildMetadata({ path: "/courses", title: "Course", noindex: true });
  return buildEntityMetadata("course", slug, {
    path: `/courses/${slug}`,
    title: course.name,
    description: `${course.name} at ${course.institution}.`,
  });
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const institution = await getInstitution(course.institutionSlug);

  const facts = [
    { label: "Qualification", title: course.level, line: course.category },
    { label: "Duration", title: course.duration, line: course.destination || course.country },
    { label: "Intakes", title: course.intakes.join(", "), line: "Confirm current intakes with a counsellor." },
    { label: "Tuition", title: course.fee, line: "Indicative only." },
  ].filter((f) => f.title);

  // The enquiry form does not read these yet, so the link carries them but nothing pre-fills.
  const enquiry = new URLSearchParams({ service: "education-counselling" });
  if (course.destinationSlug) enquiry.set("destination", course.destinationSlug);

  return (
    <>
      <InnerHero
        bg="field"
        size="md"
        title={course.name}
        lead={[course.institution, course.city, course.destination || course.country].filter(Boolean).join(" · ")}
        className="[&_h1]:order-2 [&_p]:order-3"
      >
        <div className="order-1 flex flex-wrap items-center justify-center gap-[10px]">
          {course.level && <Chip tone="white">{course.level}</Chip>}
          {course.category && <Chip tone="white">{course.category}</Chip>}
        </div>
      </InnerHero>

      {facts.length > 0 && (
        <section className="flex w-full flex-col items-center">
          <div className="container-x">
            <div className="grid gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-4">
              {facts.map((f, i) => (
                <InfoCard key={f.label} label={f.label} title={f.title} line={f.line} tone={i === 1 ? "dark" : "surface"} delay={0.1 * (i % 3)} className="min-h-[200px] justify-between" />
              ))}
            </div>
          </div>
        </section>
      )}

      {(course.descriptionHtml || course.entryRequirementsHtml) && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
              {course.descriptionHtml && <div className="article article-scroll w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: course.descriptionHtml }} />}
              {course.entryRequirementsHtml && (
                <div className="w-full max-w-[800px]">
                  <h2 className="t-h3 pb-5">Entry requirements</h2>
                  <div className="article article-scroll w-full" dangerouslySetInnerHTML={{ __html: course.entryRequirementsHtml }} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {institution && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
              <SectionHead align="left" badge="Institution" title={`About ${institution.name}`} />
              <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
                <InstitutionCard institution={institution} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <h2 className="t-h3">Ask about this course</h2>
            <p className="t-body text-muted">Send an enquiry and a counsellor will come back with entry requirements, fees and the next intake.</p>
            <PillButton href={`/contact?${enquiry.toString()}`} tone="dark">Enquire about this course</PillButton>
          </Appear>
        </div>
      </section>
    </>
  );
}
