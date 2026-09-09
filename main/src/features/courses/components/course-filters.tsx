import Link from "next/link";
import { Field } from "@/components/shared/inner";
import { Select } from "@/features/leads/components/forms";
import { Chip } from "@/components/ui/bits";
import {
  activeFilters,
  clearFilter,
  filterHref,
  INTAKES,
  LEVELS,
  type CourseQuery,
} from "@/features/courses/filters";
import type { FilterOption } from "@/features/courses/queries";
import { loadText } from "@/features/site-text/queries";

export type FilterOptions = {
  destinations: FilterOption[];
  categories: FilterOption[];
  institutions: FilterOption[];
};

// A plain GET form, so every filter ends up in the URL and the page stays server rendered.
export async function CourseFilters({ query, options }: { query: CourseQuery; options: FilterOptions }) {
  const t = await loadText();
  const names = new Map<string, string>([
    ...options.destinations.map((o) => [o.slug, o.name] as [string, string]),
    ...options.categories.map((o) => [o.slug, o.name] as [string, string]),
    ...options.institutions.map((o) => [o.slug, o.name] as [string, string]),
    ...LEVELS.map((l) => [l.value, l.label] as [string, string]),
  ]);
  const active = activeFilters(query);

  return (
    <div className="flex w-full flex-col gap-5 md:gap-[30px]">
      <form method="get" action="/courses" className="grid w-full gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Field takes no default value, so the current keyword shows as a clearable chip instead. */}
        <Field label={t("courses.filter.keyword", "Keyword")} name="q" placeholder={t("courses.filter.keyword_hint", "Course, institution or country")} />
        <Select label={t("courses.filter.destination", "Destination")} name="destination" defaultValue={query.destination ?? ""}>
          <option value="">{t("courses.filter.destination_any", "All destinations")}</option>
          {options.destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </Select>
        <Select label={t("courses.filter.level", "Qualification level")} name="level" defaultValue={query.level ?? ""}>
          <option value="">{t("courses.filter.level_any", "All levels")}</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </Select>
        <Select label={t("courses.filter.category", "Category")} name="category" defaultValue={query.category ?? ""}>
          <option value="">{t("courses.filter.category_any", "All categories")}</option>
          {options.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
        <Select label={t("courses.filter.institution", "Institution")} name="institution" defaultValue={query.institution ?? ""}>
          <option value="">{t("courses.filter.institution_any", "All institutions")}</option>
          {options.institutions.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
        </Select>
        <Select label={t("courses.filter.intake", "Intake")} name="intake" defaultValue={query.intake ?? ""}>
          <option value="">{t("courses.filter.intake_any", "Any intake")}</option>
          {INTAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <div className="flex items-end lg:col-span-3">
          <button type="submit" className="btn-black inline-flex h-[50px] items-center justify-center rounded-full px-[26px] text-[16px] font-semibold leading-[20.8px] text-white">
            {t("courses.filter.apply", "Apply filters")}
          </button>
        </div>
      </form>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-[10px]">
          {active.map((f) => (
            <Link key={f.key} href={filterHref(clearFilter(query, f.key))} aria-label={t("courses.filter.remove", "Remove filter {name}").replace("{name}", names.get(f.value) ?? f.value)}>
              <Chip>{names.get(f.value) ?? f.value} ✕</Chip>
            </Link>
          ))}
          <Link href="/courses"><Chip tone="white">{t("courses.filter.clear", "Clear all")}</Chip></Link>
        </div>
      )}
    </div>
  );
}
