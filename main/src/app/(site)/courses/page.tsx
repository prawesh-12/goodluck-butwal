import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listCourseFilterOptions, listCourses } from "@/features/courses/queries";
import { loadText } from "@/features/site-text/queries";
import { filterHref, pageCount, parseCourseFilters, type SearchParams } from "@/features/courses/filters";
import { InnerHero, SectionHead } from "@/components/shared/inner";
import { CourseFilters } from "@/features/courses/components/course-filters";
import { CourseRow } from "@/features/courses/components/course-row";
import { Pager } from "@/components/shared/pager";
import { Empty } from "@/components/shared/empty";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/courses",
    title: "Courses",
    description: "Search courses by destination, qualification level, category, institution and intake.",
  });
}

type Props = { searchParams: Promise<SearchParams> };

export default async function CoursesPage({ searchParams }: Props) {
  const [options, t] = await Promise.all([listCourseFilterOptions(), loadText()]);
  const query = parseCourseFilters(await searchParams, {
    destinations: options.destinations.map((d) => d.slug),
    categories: options.categories.map((c) => c.slug),
    institutions: options.institutions.map((i) => i.slug),
  });
  const { rows, total } = await listCourses(query);
  const pages = pageCount(total);

  return (
    <>
      <InnerHero
        badge={t("courses.hero.badge", "Courses")}
        badgeTone="chip"
        title={t("courses.hero.title", "Find a course")}
        lead={t("courses.hero.lead", "Filter by destination, qualification level, category, institution and intake.")}
        clouds={false}
      />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="flex w-full flex-col gap-[30px] md:gap-10 lg:gap-[50px]">
            <CourseFilters query={query} options={options} />

            {rows.length > 0 ? (
              <>
                <SectionHead align="left" title={`${total} ${total === 1 ? "course" : "courses"}`} />
                <div className="flex w-full flex-col gap-5">
                  {rows.map((course, i) => <CourseRow key={course.slug} course={course} delay={Math.min(i * 0.04, 0.4)} />)}
                </div>
                <Pager page={query.page} pages={pages} hrefFor={(n) => filterHref(query, { page: n })} />
              </>
            ) : (
              <Empty
                title={t("empty.courses.title", "No courses match those filters")}
                lead={t("empty.courses.lead", "Clear a filter to widen the search, or ask a counsellor what is open for your intake.")}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
