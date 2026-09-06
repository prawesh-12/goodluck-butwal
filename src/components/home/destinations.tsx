import Link from "next/link";
import { gl, img } from "@/lib/assets";
import { destinations } from "@/content/destinations";
import { Appear } from "@/components/ui/appear";
import { Badge } from "@/components/ui/bits";

type Card = { slug: string; name: string; line: string; fact?: [string, string]; bg: string; flag: string; href: string };

// One verified figure per destination page, taken from the destination copy.
const facts: Record<string, [string, string]> = {
  australia: ["22,000+", "Courses available"],
  "united-kingdom": ["3 years", "Most undergraduate courses"],
};

const fromContent = (slug: string): Card => {
  const d = destinations.find((x) => x.slug === slug)!;
  return { slug, name: d.name, line: d.overview, fact: facts[slug], bg: d.card, flag: d.flag, href: `/study-abroad/${slug}` };
};

// New Zealand has no destination page on goodluck_main yet, so its card only invites an enquiry.
export const destinationCards: Card[] = [
  fromContent("australia"),
  { slug: "new-zealand", name: "New Zealand", line: "Ask our counsellors about studying in New Zealand.", bg: gl.newZealand, flag: "/images/flags/new-zealand.svg", href: "/contact/book-consultation" },
  fromContent("united-kingdom"),
];

export function DestinationCard({ slug, phone, className = "" }: { slug: string; phone?: boolean; className?: string }) {
  const d = destinationCards.find((x) => x.slug === slug)!;
  return (
    <Link href={d.href} className={`group flex h-full w-full flex-col gap-[6px] rounded-[10px] bg-surface p-[6px] md:rounded-[20px] ${className}`}>
      <div className={`relative w-full overflow-clip rounded-[6px] bg-white md:rounded-[14px] ${phone ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <img src={d.bg} alt={d.name} className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
        <span className="absolute left-3 top-3 flex size-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(29,29,29,0.15)]">
          <img src={d.flag} alt="" className="size-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-[4px]">
          <h3 className="t-h4">{d.name}</h3>
          <p className="t-base text-muted">{d.line}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-hairline pt-4">
          {d.fact ? (
            <div className="flex flex-col items-start">
              <p className="t-h5">{d.fact[0]}</p>
              <p className="t-small text-muted">{d.fact[1]}</p>
            </div>
          ) : (
            <p className="t-base font-semibold text-ink">Book a consultation</p>
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
