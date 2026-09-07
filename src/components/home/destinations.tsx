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
    <Link href={d.href} className={`group relative block w-full overflow-clip rounded-[16px] bg-surface md:rounded-[24px] ${phone ? "aspect-square" : "aspect-[4/5]"} ${className}`}>
      <img src={d.bg} alt={d.name} style={{ objectPosition: d.pos }} className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_100%)]" />
      <span className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(29,29,29,0.15)]">
        <img src={d.flag} alt="" className="size-5" />
      </span>
      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-4 rounded-[14px] bg-white/15 p-4 ring-1 ring-inset ring-white/30 backdrop-blur-[14px] md:inset-x-4 md:bottom-4 md:rounded-[18px] md:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="t-h4 text-white">{d.name}</h3>
          <p className="t-base text-white/85">{d.line}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/25 pt-4">
          {d.fact ? (
            <div className="flex min-w-0 flex-col">
              <p className="t-base font-semibold text-white">{d.fact[0]}</p>
              <p className="t-small truncate text-white/75">{d.fact[1]}</p>
            </div>
          ) : (
            <p className="t-base truncate font-semibold text-white">Book a consultation</p>
          )}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:translate-x-1">
            <img src={img.arrow} alt="" className="h-2 w-3" />
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
