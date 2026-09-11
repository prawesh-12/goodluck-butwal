import Link from "next/link";
import { destinationArt, img } from "@/config/assets";
import type { PublicDestination } from "@/features/destinations/queries";
import { Appear } from "@/components/ui/appear";
import { Badge } from "@/components/ui/bits";
import { loadText } from "@/features/site-text/queries";
import { CARD_SIZES, Img } from "@/components/ui/img";

type Card = { slug: string; name: string; line: string; fact?: [string, string]; bg: string; pos: string; flag: string; href: string };

// Where the landmark sits in each 3:2 photo, so the tall crop keeps it in frame.
const focus: Record<string, string> = { australia: "60% 50%", "new-zealand": "40% 50%", "united-kingdom": "72% 50%" };

// One verified figure per destination page, taken from the destination copy.
const facts: Record<string, [string, string]> = {
  australia: ["22,000+", "Courses available"],
  "united-kingdom": ["3 years", "Most undergraduate courses"],
};

const fromRow = (rows: PublicDestination[], slug: string): Card => {
  const d = rows.find((x) => x.slug === slug)!;
  return { slug, name: d.name, line: d.overview, fact: facts[slug], bg: d.card, pos: focus[slug], flag: d.flag, href: `/study-abroad/${slug}` };
};

// New Zealand has no page of its own yet, so its card only invites an enquiry.
export const destinationCards = (rows: PublicDestination[]): Card[] => [
  fromRow(rows, "australia"),
  { slug: "new-zealand", name: "New Zealand", line: "Ask our counsellors about studying in New Zealand.", bg: destinationArt["new-zealand"].card, pos: focus["new-zealand"], flag: destinationArt["new-zealand"].flag, href: "/contact/book-consultation" },
  fromRow(rows, "united-kingdom"),
];

export function DestinationCard({ cards, slug, phone, className = "", cta = "Book a consultation" }: { cards: Card[]; slug: string; phone?: boolean; className?: string; cta?: string }) {
  const d = cards.find((x) => x.slug === slug)!;
  return (
    <Link
      href={d.href}
      className={`group flex h-full w-full flex-col overflow-clip rounded-[20px] bg-white ring-1 ring-hairline shadow-[0_24px_50px_-32px_rgba(29,29,29,0.35)] md:rounded-[28px] ${className}`}
    >
      <div className={`relative w-full overflow-clip bg-surface ${phone ? "aspect-[16/10] md:aspect-[4/3]" : "aspect-[4/3]"}`}>
        <Img src={d.bg} alt={d.name} sizes={CARD_SIZES} style={{ objectPosition: d.pos }} className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
      </div>
      <div className="relative flex flex-1 flex-col gap-5 p-5 pt-8 md:p-6 md:pt-9">
        <span className="absolute -top-6 left-5 flex size-12 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(29,29,29,0.18)] ring-4 ring-white md:left-6">
          <Img src={d.flag} alt="" w={48} className="size-6 rounded-full" loading="lazy" decoding="async" />
        </span>
        <div className="flex flex-col gap-[6px]">
          <h3 className="t-h4">{d.name}</h3>
          <p className="t-base text-muted">{d.line}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          {d.fact ? (
            <p className="t-small inline-flex h-9 items-center gap-[6px] rounded-full bg-surface px-4 text-muted">
              <span className="font-semibold text-ink">{d.fact[0]}</span> {d.fact[1].toLowerCase()}
            </p>
          ) : (
            <p className="t-small inline-flex h-9 items-center rounded-full bg-surface px-4 font-semibold text-ink">{cta}</p>
          )}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink transition-transform duration-300 group-hover:translate-x-1">
            <Img src={img.arrow} alt="" w={24} className="h-2 w-3 invert" loading="lazy" decoding="async" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function Destinations({ cards }: { cards: Card[] }) {
  const t = await loadText();
  const cardCta = t("home.destinations.card_cta", "Book a consultation");
  return (
    <section id="study-abroad" className="pt-section flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <Appear className="flex w-full max-w-[860px] flex-col items-center gap-[10px] px-4 md:px-5 lg:px-[30px]">
          <Badge className="ring-1 ring-hairline">{t("home.destinations.badge", "Study abroad")}</Badge>
          <h2 className="t-h2 text-center">{t("home.destinations.title", "Countries we help you study in")}</h2>
          <p className="t-body text-center text-muted">{t("home.destinations.lead", "Study in Australia, the United Kingdom and New Zealand with us.")}</p>
        </Appear>
        <div className="container-x">
          <div className="grid w-full gap-[10px] md:grid-cols-3 md:gap-[30px]">
            {/* One card per destination. Two, one hidden per breakpoint, downloaded every
                picture twice. `phone` now carries the crop change on its own. */}
            {cards.map((d, i) => (
              <Appear key={d.slug} delay={0.1 * i}><DestinationCard cards={cards} slug={d.slug} phone cta={cardCta} /></Appear>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
