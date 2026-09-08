import Link from "next/link";
import { Appear } from "@/components/ui/appear";
import { Chip } from "@/components/ui/bits";
import type { PublicInstitution } from "@/server/queries/catalogue";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// The news card, with the institution logo where the article banner goes.
// Same markup as NewsCard, which hard-codes a /news link and renders no title. An institution
// logo carries no name, so the card needs both.
export function InstitutionCard({
  institution,
  delay = 0,
  className,
}: {
  institution: PublicInstitution;
  delay?: number;
  className?: string;
}) {
  const place = [institution.city, institution.country].filter(Boolean).join(", ");
  return (
    <Appear delay={delay} className={cx("p-1", className)}>
      <Link
        href={`/institutions/${institution.slug}`}
        aria-label={institution.name}
        className="group flex h-full flex-col gap-[10px] overflow-clip rounded-[10px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] lg:rounded-[20px]"
      >
        <div className="flex aspect-[1533/458] w-full items-center justify-center overflow-clip rounded-[6px] bg-surface p-6 lg:rounded-[10px]">
          {institution.logo ? (
            <img src={institution.logo} alt={institution.name} className="max-h-full w-auto max-w-[70%] object-contain transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" decoding="async" />
          ) : (
            <span className="t-base px-4 text-center text-muted">{institution.name}</span>
          )}
        </div>
        <div className="flex flex-col gap-[10px] p-4 lg:p-[10px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            {institution.destination && <Chip>{institution.destination}</Chip>}
            {institution.isPartner && <Chip>Partner</Chip>}
            {place && <span className="t-small text-muted">{place}</span>}
          </div>
          <h3 className="t-h5">{institution.name}</h3>
        </div>
      </Link>
    </Appear>
  );
}
