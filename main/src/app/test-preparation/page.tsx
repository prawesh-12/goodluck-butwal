import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { listTestPrepCourses } from "@/server/queries/test-prep";
import { listServiceFaqs } from "@/server/queries/destinations";
import { listTeam } from "@/server/queries/people";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { InfoCard, InnerHero, SectionHead } from "@/components/inner";
import { Accordion, FaqCta } from "@/components/home/faqs";
import { loadText } from "@/server/queries/text";

export async function generateMetadata(): Promise<Metadata> {
  const courses = await listTestPrepCourses();
  const description = courses
    .map((course) => course.summary)
    .filter(Boolean)
    .join(" ");
  return buildMetadata({ path: "/test-preparation", title: "Test preparation", description });
}

const TONES = ["blue", "surface"] as const;

export default async function TestPreparationPage() {
  const t = await loadText();
  const [courses, faqs, faces] = await Promise.all([
    listTestPrepCourses(),
    listServiceFaqs("ielts-coaching"),
    listTeam().then((team) => team.slice(0, 3)),
  ]);

  return (
    <>
      <InnerHero
        badge={t("testprep.hero.badge", "Test preparation")}
        title={t("testprep.hero.title", "Test preparation")}
        width={1260}
        after={
          courses.length > 0 ? (
            <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
              {courses.map((course, i) => (
                <Link key={course.slug} href={`/test-preparation/${course.slug}`} className="min-w-0">
                  <InfoCard
                    label={course.testType.toUpperCase()}
                    title={course.name}
                    line={course.summary}
                    tone={TONES[i % TONES.length]}
                    delay={0.1 * i}
                    className="min-h-[220px] justify-between"
                  />
                </Link>
              ))}
            </div>
          ) : null
        }
      />

      <section className="flex w-full flex-col items-center">
        <div className="container-x">
          <Appear className="flex w-full flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <SectionHead badge={t("testprep.batches.badge", "Batches")} title={t("testprep.batches.title", "Upcoming batches")} />
            <PillButton href="/test-preparation/batches" tone="dark">
              See the batch dates
            </PillButton>
          </Appear>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
          <div className="container-x">
            <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
              <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
                <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                  <h2 className="t-h2">{t("testprep.faqs.title", "Common questions")}</h2>
                </div>
                <FaqCta faces={faces} className="order-3 md:order-none" />
              </Appear>
              <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
                <Accordion items={faqs} />
              </Appear>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
