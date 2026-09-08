import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs, course as courseSchema } from "@/components/seo/schema";
import { company } from "@/lib/site";
import { notFound } from "next/navigation";
import { getTestPrepCourse, listTestPrepCourses, upcomingBatchesForCourse } from "@/server/queries/test-prep";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { CheckRow } from "@/components/ui/bits";
import { InnerHero, SectionHead } from "@/components/inner";
import { BatchTable } from "@/components/test-prep/batch-table";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () =>
  (await listTestPrepCourses()).map((course) => ({ slug: course.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getTestPrepCourse(slug);
  if (!course) return buildMetadata({ path: "/test-preparation", title: "Test preparation", noindex: true });
  return buildEntityMetadata("testPrepCourse", slug, {
    path: `/test-preparation/${slug}`,
    title: course.name,
    description: course.summary,
  });
}

export default async function TestPrepCoursePage({ params }: Props) {
  const course = await getTestPrepCourse((await params).slug);
  if (!course) notFound();

  const batches = await upcomingBatchesForCourse(course.id);

  return (
    <>
      <JsonLd
        data={[
          courseSchema({ path: `/test-preparation/${course.slug}`, name: course.name, description: course.summary, provider: company.name }),
          breadcrumbs([{ name: "Home", path: "/" }, { name: "Test preparation", path: "/test-preparation" }, { name: course.name, path: `/test-preparation/${course.slug}` }]),
        ]}
      />
      <InnerHero
        badge={course.testType.toUpperCase()}
        badgeTone="chip-white"
        title={course.name}
        lead={course.summary || undefined}
        bg="field"
      />

      {course.descriptionHtml ? (
        <section className="flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <Appear>
              <div className="article article-scroll w-full" dangerouslySetInnerHTML={{ __html: course.descriptionHtml }} />
            </Appear>
          </div>
        </section>
      ) : null}

      {course.syllabus.length > 0 ? (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
            <div className="flex flex-col items-start gap-[30px] md:gap-10">
              <SectionHead align="left" badge="Syllabus" title="What the course covers" />
              <div className="flex w-full flex-col gap-[10px]">
                {course.syllabus.map((item) => (
                  <CheckRow key={item.title}>
                    <strong className="text-ink">{item.title}</strong> {item.body}
                  </CheckRow>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge="Batches" title="Upcoming batches" />
            <BatchTable batches={batches} />
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <h2 className="t-h3">Still have questions?</h2>
            <PillButton href="/contact/book-consultation" tone="dark">
              Book an appointment
            </PillButton>
          </Appear>
        </div>
      </section>
    </>
  );
}
