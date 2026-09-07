import Link from "next/link";
import { gl, img } from "@/lib/assets";
import { destinations } from "@/content/destinations";
import { Appear } from "@/components/ui/appear";
import { Badge } from "@/components/ui/bits";

type Card = { slug: string; name: string; line: string; fact?: [string, string]; bg: string; pos: string; flag: string; href: string };

// Where the landmark sits in each 3:2 photo, so the tall crop keeps it in frame.
const focus: Record<string, string> = { australia: "60% 50%", "new-zealand": "40% 50%", "united-kingdom": "72% 50%" };

// One verified figure per destination page, taken from the destination copy.
const facts: Record<string, [string, string]> = {
  australia: ["22,000+", "Courses available"],
  "united-kingdom": ["3 years", "Most undergraduate courses"],
};

const fromContent = (slug: string): Card => {
  const d = destinations.find((x) => x.slug === slug)!;
  return { slug, name: d.name, line: d.overview, fact: facts[slug], bg: d.card, pos: focus[slug], flag: d.flag, href: `/study-abroad/${slug}` };
};

// New Zealand has no destination page on goodluck_main yet, so its card only invites an enquiry.
export const destinationCards: Card[] = [
  fromContent("australia"),
  { slug: "new-zealand", name: "New Zealand", line: "Ask our counsellors about studying in New Zealand.", bg: gl.newZealand, pos: focus["new-zealand"], flag: "/images/flags/new-zealand.svg", href: "/contact/book-consultation" },
  fromContent("united-kingdom"),
];

export function DestinationCard({ slug, phone, className = "" }: { slug: string; phone?: boolean; className?: string }) {
  const d = destinationCards.find((x) => x.slug === slug)!;
  return (
    <Link
      href={d.href}
      className={`group flex h-full w-full flex-col overflow-clip rounded-[20px] bg-white ring-1 ring-hairline shadow-[0_24px_50px_-32px_rgba(29,29,29,0.35)] md:rounded-[28px] ${className}`}
    >
      <div className={`relative w-full overflow-clip bg-surface ${phone ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <img src={d.bg} alt={d.name} style={{ objectPosition: d.pos }} className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="relative flex flex-1 flex-col gap-5 p-5 pt-8 md:p-6 md:pt-9">
        <span className="absolute -top-6 left-5 flex size-12 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(29,29,29,0.18)] ring-4 ring-white md:left-6">
          <img src={d.flag} alt="" className="size-6 rounded-full" />
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
            <p className="t-small inline-flex h-9 items-center rounded-full bg-surface px-4 font-semibold text-ink">Book a consultation</p>
          )}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink transition-transform duration-300 group-hover:translate-x-1">
            <img src={img.arrow} alt="" className="h-2 w-3 invert" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Destinations() {
  return (
    <section id="study-abroad" className="pt-section flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <Appear className="flex w-full max-w-[860px] flex-col items-center gap-[10px] px-4 md:px-5 lg:px-[30px]">
          <Badge className="ring-1 ring-hairline">Study abroad</Badge>
          <h2 className="t-h2 text-center">Countries we help you study in</h2>
          <p className="t-body text-center text-muted">Study in Australia, the United Kingdom and New Zealand with us.</p>
        </Appear>
        <div className="container-x">
          <div className="grid w-full gap-[10px] md:grid-cols-3 md:gap-[30px]">
            {destinationCards.map((d, i) => (
              <Appear key={d.slug} delay={0.1 * i} className="md:hidden"><DestinationCard slug={d.slug} phone /></Appear>
            ))}
            {destinationCards.map((d, i) => (
              <Appear key={d.slug} delay={0.1 * i} className="hidden md:block"><DestinationCard slug={d.slug} /></Appear>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
