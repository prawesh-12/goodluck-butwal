import Link from "next/link";
import { img } from "@/lib/assets";
import { services } from "@/content/services";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, Chip } from "@/components/ui/bits";

// Full-bleed photo with a frosted caption bar: label and title only, as the brief asked for.
export function ServiceCard({ slug, label, title, image, imageAlt, className = "" }: { slug: string; label: string; title: string; image: string; imageAlt: string; className?: string }) {
  return (
    <Link href={`/services/${slug}`} className={`group relative block overflow-clip rounded-[10px] bg-surface md:rounded-[20px] ${className}`}>
      <img src={image} alt={imageAlt} className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_100%)] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-[10px] bottom-[10px] flex items-center justify-between gap-4 rounded-[8px] bg-white/80 p-4 ring-1 ring-inset ring-white/60 backdrop-blur-[16px] md:rounded-[14px] md:p-5">
        <div className="flex min-w-0 flex-col items-start gap-[8px]">
          <Chip tone="surface">{label}</Chip>
          <h3 className="t-h5 truncate">{title}</h3>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink transition-transform duration-300 group-hover:translate-x-1">
          <img src={img.arrow} alt="" className="h-2 w-3 invert" />
        </span>
      </div>
    </Link>
  );
}

export function Services() {
  const [counselling, visa, scholarship, ielts] = services;
  return (
    <section id="services" className="pt-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="flex flex-col items-start gap-[30px] md:gap-[50px]">
          <div className="flex w-full flex-col gap-[10px] md:flex-row md:items-end md:gap-[30px] lg:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">Our services</Badge>
              <h2 className="t-h2">Get the right help</h2>
            </Appear>
            <Appear delay={0.1} className="flex flex-1 flex-col items-start gap-4 md:items-end md:gap-5">
              <p className="t-body text-muted md:text-right">Education counselling, visa guidance, scholarship guidance and IELTS coaching.</p>
              <PillButton href="/services" tone="dark">
                View all services
              </PillButton>
            </Appear>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
            <Appear className="h-[328px] md:h-[400px] lg:col-span-2 lg:h-[420px]"><ServiceCard slug={counselling.slug} label={counselling.label} title={counselling.title} image={counselling.image} imageAlt={counselling.imageAlt} className="h-full" /></Appear>
            <Appear delay={0.1} className="h-[328px] md:h-[400px] lg:h-[420px]"><ServiceCard slug={visa.slug} label={visa.label} title={visa.title} image={visa.image} imageAlt={visa.imageAlt} className="h-full" /></Appear>
            <Appear delay={0.2} className="h-[328px] md:h-[400px] lg:h-[420px]"><ServiceCard slug={scholarship.slug} label={scholarship.label} title={scholarship.title} image={scholarship.image} imageAlt={scholarship.imageAlt} className="h-full" /></Appear>
            <Appear delay={0.3} className="h-[328px] md:h-[400px] lg:col-span-2 lg:h-[420px]"><ServiceCard slug={ielts.slug} label={ielts.label} title={ielts.title} image={ielts.image} imageAlt={ielts.imageAlt} className="h-full" /></Appear>
          </div>
        </div>
      </div>
    </section>
  );
}
