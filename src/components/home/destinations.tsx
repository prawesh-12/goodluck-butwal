import Link from "next/link";
import { gl } from "@/lib/assets";
import { destinations } from "@/content/destinations";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { Badge, Chip, Ticker } from "@/components/ui/bits";

type Card = { slug: string; name: string; line: string; fact?: [string, string]; photo: string; photoAlt: string; bg: string; flag?: string; code: string; href: string };

// One verified figure per destination page, taken from the destination copy.
const facts: Record<string, [string, string]> = {
  australia: ["22,000+", "Courses available"],
  "united-kingdom": ["3 years", "Most undergraduate courses"],
};

const fromContent = (slug: string, code: string): Card => {
  const d = destinations.find((x) => x.slug === slug)!;
  return { slug, name: d.name, line: d.overview, fact: facts[slug], photo: d.hero, photoAlt: d.heroAlt, bg: d.card, flag: d.flag, code, href: `/study-abroad/${slug}` };
};

// New Zealand has no destination page on goodluck_main yet, so its card only invites an enquiry.
export const destinationCards: Card[] = [
  fromContent("australia", "AU"),
  { slug: "new-zealand", name: "New Zealand", line: "Ask our counsellors about studying in New Zealand.", photo: gl.newZealand, photoAlt: "Study in New Zealand", bg: gl.newZealand, flag: "/assets/generated/flag-nz.svg", code: "NZ", href: "/contact/book-consultation" },
  fromContent("united-kingdom", "UK"),
];

export function DestinationCard({ slug, phone, className = "" }: { slug: string; phone?: boolean; className?: string }) {
  const d = destinationCards.find((x) => x.slug === slug)!;
  return (
    <Link href={d.href} className={`relative flex flex-col justify-center overflow-hidden rounded-[10px] p-[10px] md:rounded-[30px] ${phone ? "h-[232px] w-full" : "h-[420px] w-[380px] shrink-0"} ${className}`}>
      <img src={d.bg} alt="" className="absolute inset-0 size-full object-cover" />
      <div className={`relative flex h-full flex-col items-start overflow-clip rounded-[6px] bg-white/30 p-5 ring-1 ring-inset ring-white/30 backdrop-blur-[20px] md:rounded-[20px] md:p-[30px] ${phone ? "justify-start gap-[30px]" : "justify-between"}`}>
        <div className={`flex flex-col items-start gap-[6px] ${phone ? "" : "pb-[30px]"}`}>
          <span className="flex size-10 items-center justify-center rounded-full bg-white font-display text-[13px] font-semibold text-ink">
            {d.flag ? <img src={d.flag} alt="" className="size-5" /> : d.code}
          </span>
          <h3 className="t-h4">{d.name}</h3>
          <p className="t-body text-muted">{d.line}</p>
        </div>
        {d.fact ? (
          <div className="flex flex-col items-start gap-[6px]">
            <h4 className="t-h5">{d.fact[0]}</h4>
            <p className="t-base text-ink">{d.fact[1]}</p>
          </div>
        ) : (
          <p className="t-base font-semibold text-ink">Book a consultation →</p>
        )}
      </div>
    </Link>
  );
}

export function Destinations() {
  return (
    <section id="study-abroad" className="pb-section flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <Appear className="flex w-full max-w-[860px] flex-col items-center gap-[10px] px-4 md:px-5 lg:px-[30px]">
          <Badge className="ring-1 ring-hairline">Study abroad</Badge>
          <h2 className="t-h2 text-center">Best countries to study</h2>
        </Appear>
        <Appear delay={0.1} className="flex w-full flex-col gap-[10px] px-4 md:hidden">
          {destinationCards.map((d) => (
            <DestinationCard key={d.slug} slug={d.slug} phone />
          ))}
        </Appear>
        <Appear delay={0.1} className="hidden w-full md:block">
          <Ticker gap={10} speed={80} className="w-full">
            {destinationCards.map((d) => (
              <div key={d.slug} className="contents">
                <div className="h-[420px] w-[380px] shrink-0 overflow-clip rounded-[30px]">
                  <img src={d.photo} alt={d.photoAlt} className="size-full object-cover" />
                </div>
                <DestinationCard slug={d.slug} />
              </div>
            ))}
          </Ticker>
        </Appear>
        <Appear delay={0.2} className="flex w-full max-w-[860px] flex-col items-center gap-5 px-4 md:px-5 lg:gap-[30px] lg:px-[30px]">
          <div className="flex flex-wrap items-center justify-center gap-[10px]">
            {["Study in Australia, the UK and New Zealand with us", "Free consultation", "Visa guidance", "Coaching classes"].map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
          <div className="flex w-full max-w-[720px] flex-col items-center gap-5 rounded-[10px] bg-surface p-5 md:rounded-[20px] md:p-[30px]">
            <p className="t-h5 text-center">&ldquo;{about.founderQuote}&rdquo;</p>
            <div className="flex items-center gap-3">
              <img src={gl.founders} alt="" className="size-12 rounded-full object-cover object-top" />
              <div className="flex flex-col">
                <p className="t-base font-semibold text-ink">{about.founders}</p>
                <p className="t-small text-muted">Co-founders, Goodluck Education &amp; Migration</p>
              </div>
            </div>
          </div>
        </Appear>
      </div>
    </section>
  );
}
