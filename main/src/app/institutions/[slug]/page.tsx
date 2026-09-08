import type { Metadata } from "next";
import { buildEntityMetadata, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/components/seo/schema";
import { notFound } from "next/navigation";
import { getInstitution, listCourses, listInstitutionImages } from "@/server/queries/catalogue";
import { pageCount, type SearchParams } from "@/components/catalogue/filters";
import { Appear } from "@/components/ui/appear";
import { FlatButton, PillButton } from "@/components/ui/button";
import { Chip, Ticker } from "@/components/ui/bits";
import { InnerHero, SectionHead } from "@/components/inner";
import { CourseRow } from "@/components/catalogue/course-row";
import { Pager } from "@/components/catalogue/pager";
import { Empty } from "@/components/catalogue/empty";
import { loadText } from "@/server/queries/text";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getInstitution(slug);
  if (!institution) return buildMetadata({ path: "/institutions", title: "Institution", noindex: true });
  return buildEntityMetadata("institution", slug, {
    path: `/institutions/${slug}`,
    title: institution.name,
    description: [institution.city, institution.country].filter(Boolean).join(", "),
  });
}

export default async function InstitutionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const institution = await getInstitution(slug);
  if (!institution) notFound();

  const raw = (await searchParams).page;
  const parsed = Number.parseInt((Array.isArray(raw) ? raw[0] : raw) ?? "", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  const [gallery, courses, t] = await Promise.all([
    listInstitutionImages(slug),
    listCourses({ institution: slug, page }),
    loadText(),
  ]);
  const pages = pageCount(courses.total);
  const place = [institution.city, institution.country].filter(Boolean).join(", ");
  const hrefFor = (n: number) => (n > 1 ? `/institutions/${slug}?page=${n}` : `/institutions/${slug}`);

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Institutions", path: "/institutions" }, { name: institution.name, path: `/institutions/${institution.slug}` }])} />
      <InnerHero
        bg="field"
        title={institution.name}
        lead={place || undefined}
        className="[&_h1]:order-2 [&_p]:order-3"
        after={
          institution.logo ? (
            <Appear delay={0.1} className="w-full">
              <div className="mx-auto flex aspect-[16/6] w-full max-w-[560px] items-center justify-center overflow-clip rounded-[10px] bg-white p-8 ring-1 ring-hairline md:rounded-[30px]">
                <img src={institution.logo} alt={institution.name} className="max-h-full w-auto max-w-[70%] object-contain" loading="lazy" decoding="async" />
              </div>
            </Appear>
          ) : undefined
        }
      >
        <div className="order-1 flex flex-wrap items-center justify-center gap-[10px]">
          {institution.destination && <Chip tone="white">{institution.destination}</Chip>}
          {institution.isPartner && <Chip tone="white">Partner institution</Chip>}
        </div>
      </InnerHero>

      {institution.descriptionHtml && (
        <section className="flex w-full flex-col items-center">
          <div className="container-x">
            <div className="flex flex-col items-center">
              <div className="article article-scroll w-full max-w-[800px]" dangerouslySetInnerHTML={{ __html: institution.descriptionHtml }} />
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="pt-section flex w-full flex-col items-center">
          <div className="w-full px-4 md:px-[30px]">
            <Ticker gap={30} speed={120} className="w-full [--gap-override:20px] md:[--gap-override:30px]">
              {gallery.map((image) => (
                <img key={image.src} src={image.src} alt={image.caption || institution.name} className="h-[180px] w-auto shrink-0 rounded-[10px] object-cover md:h-[260px] md:rounded-[20px]" loading="lazy" decoding="async" />
              ))}
            </Ticker>
          </div>
        </section>
      )}

      <section className="pt-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead align="left" badge="Courses" title={`Courses at ${institution.name}`} lead={courses.total > 0 ? `${courses.total} published courses.` : undefined} />
            {courses.rows.length > 0 ? (
              <>
                <div className="flex w-full flex-col gap-5">
                  {courses.rows.map((course, i) => <CourseRow key={course.slug} course={course} delay={Math.min(i * 0.04, 0.4)} />)}
                </div>
                <Pager page={page} pages={pages} hrefFor={hrefFor} />
              </>
            ) : (
              <Empty
                title={t("empty.institution_courses.title", "No courses listed yet")}
                lead={t("empty.institution_courses.lead", "Ask a counsellor which programmes this institution is taking applications for.")}
              />
            )}
          </div>
        </div>
      </section>

      <section className="pt-section flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <h2 className="t-h3">Thinking about {institution.name}?</h2>
            <p className="t-body text-muted">A counsellor can check entry requirements, intakes and fees with you.</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <PillButton href="/contact/book-consultation" tone="dark">Book a free consultation</PillButton>
              {institution.website && <FlatButton href={institution.website} tone="dark">Visit website</FlatButton>}
            </div>
          </Appear>
        </div>
      </section>
    </>
  );
}
