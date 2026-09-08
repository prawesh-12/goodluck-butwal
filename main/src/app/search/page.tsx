import type { Metadata } from "next";
import { search } from "@/server/queries/search";
import { loadText } from "@/server/queries/text";
import { searchTerm } from "@/components/search/query";
import { Chip } from "@/components/ui/bits";
import { Field, InnerHero, NewsCard } from "@/components/inner";
import { Empty } from "@/components/catalogue/empty";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const term = searchTerm((await searchParams).q);
  return {
    title: term ? `Search: ${term.q}` : "Search",
    description: "Search courses, institutions, destinations, services, events and news.",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const term = searchTerm(raw);
  const [groups, t] = await Promise.all([search(raw), loadText()]);
  const total = groups.reduce((sum, group) => sum + group.count, 0);

  return (
    <>
      <InnerHero
        badge="Search"
        badgeTone="chip"
        title={term ? `Results for “${term.q}”` : "Search"}
        size="md"
        lead={term ? `${total} ${total === 1 ? "match" : "matches"} across the site.` : "Courses, institutions, destinations, services, events and news."}
        clouds={false}
        after={
          <form method="get" action="/search" className="w-full">
            <div className="flex flex-col items-stretch gap-5 md:flex-row md:items-end">
              <Field label="Search" name="q" placeholder="Course, institution, country or keyword" className="w-full" />
              <button type="submit" className="btn-black inline-flex h-[50px] shrink-0 items-center justify-center rounded-full px-[26px] text-[16px] font-semibold leading-[20.8px] text-white">
                Search
              </button>
            </div>
          </form>
        }
      />

      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          {!term ? (
            <Empty
              title={t("empty.search.prompt.title", "Type something to search")}
              lead={t("empty.search.prompt.lead", "Try a course name, an institution, a country, or a keyword such as scholarship.")}
              href="/courses"
              action={t("empty.search.prompt.cta", "Browse courses")}
            />
          ) : groups.length === 0 ? (
            <Empty
              title={t("empty.search.title", "Nothing matches “{q}”").replace("{q}", term.q)}
              lead={t("empty.search.lead", "Try a shorter word, a country name, or the name of a course or institution. A counsellor can also look for you.")}
            />
          ) : (
            <div className="flex w-full flex-col gap-[30px] md:gap-10 lg:gap-[50px]">
              {groups.map((group) => (
                <div key={group.kind} className="flex w-full flex-col gap-5 md:gap-[30px]">
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <h2 className="t-h3">{group.label}</h2>
                    <Chip>{group.count}</Chip>
                  </div>
                  <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
                    {group.hits.map((hit, i) => (
                      <NewsCard key={hit.href} article={hit.article} href={hit.href} delay={0.05 * i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
