import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { localBusiness } from "@/components/seo/schema";
import { gl, img } from "@/lib/assets";
import { company } from "@/lib/site";
import { Appear } from "@/components/ui/appear";
import { FlatButton } from "@/components/ui/button";
import { Badge, SocialLinks } from "@/components/ui/bits";
import { SectionHead } from "@/components/inner";
import { EnquiryForm } from "@/components/forms";
import { OfficeContactCards } from "@/components/contact-cards";
import { listOffices } from "@/server/queries/offices";
import { listAllFaqs, listDestinations } from "@/server/queries/destinations";
import { Accordion, FaqCta } from "@/components/home/faqs";
import { listTeam } from "@/server/queries/people";
import { loadText } from "@/server/queries/text";
import { formText } from "@/server/queries/form-text";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/contact",
    title: "Contact",
    description: "Talk to our experts in Melbourne, Butwal or Cebu.",
  });
}
const tones = ["surface", "dark", "blue"] as const;

export default async function ContactPage() {
  const [offices, faces, destinations, allFaqs, t, forms] = await Promise.all([
    listOffices(),
    listTeam().then((team) => team.slice(0, 3)),
    listDestinations(),
    listAllFaqs(),
    loadText(),
    formText(),
  ]);
  const openInMaps = t("contact.offices.maps_link", "Open in Maps");

  return (
    <>
      <JsonLd data={offices.map((o) => localBusiness({ name: o.label, address: o.address, city: o.city, country: o.country, phone: o.phone, hours: o.hours }))} />
      <section className="relative flex w-full flex-col items-center overflow-clip pb-[100px] pt-32 md:pb-[160px] md:pt-[158px] lg:pb-[200px] lg:pt-[194px]">
        <div aria-hidden className="absolute inset-0 z-0 overflow-clip">
          <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,#fff_50%)]" />
          <img src={img.fieldSky} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 0%" }} loading="lazy" decoding="async" />
        </div>
        <img aria-hidden src={img.cloud1} alt="" className="pointer-events-none absolute z-[1] hidden w-[602px] max-w-none opacity-80 lg:block" style={{ top: 50, left: -50 }} loading="lazy" decoding="async" />
        <img aria-hidden src={img.cloud3} alt="" className="pointer-events-none absolute z-[1] hidden w-[584px] max-w-none opacity-80 lg:block" style={{ top: -150, right: 30 }} loading="lazy" decoding="async" />
        <div className="container-x relative z-[2]">
          <div className="grid gap-[30px] md:grid-cols-2 lg:gap-[70px]">
            <Appear y={10} duration={0.6} className="flex flex-col items-start gap-5 md:gap-10">
              <div className="flex flex-col items-start gap-[10px]">
                <Badge tone="white" className="ring-1 ring-hairline">{t("contact.hero.badge", "Quick contact")}</Badge>
                <h1 className="t-h1-md">{t("contact.hero.title", "Don’t hesitate to contact us")}</h1>
                <p className="t-body text-muted">{t("contact.hero.lead", "Let’s connect. Make a free consultation with our expert team.")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <FlatButton href={`mailto:${company.email}`}>{company.email}</FlatButton>
                <SocialLinks />
              </div>
              <OfficeContactCards offices={offices} />
            </Appear>
            <Appear y={10} delay={0.1} duration={0.6} className="relative flex flex-col items-start gap-10 overflow-clip rounded-[10px] bg-surface p-5 pb-20 md:rounded-[30px] md:pb-[70px] lg:p-10 lg:pb-[120px]">
              <div className="relative z-[2] w-full"><EnquiryForm destinations={destinations} text={forms} /></div>
              <img aria-hidden src={gl.campus} alt="" className="pointer-events-none absolute -left-[10px] -right-[10px] bottom-[-20px] z-[1] w-[calc(100%+20px)] max-w-none object-contain object-top" loading="lazy" decoding="async" />
            </Appear>
          </div>
        </div>
      </section>

      <section className="pb-section flex w-full flex-col items-center">
        <div className="container-x">
          <div className="flex flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
            <SectionHead badge={t("contact.offices.badge", "Our worldwide offices")} title={t("contact.offices.title", "Explore our office worldwide")} />
            <div className="grid w-full gap-5 md:grid-cols-3 md:gap-[30px] lg:gap-[50px]">
              {offices.map((o, i) => {
                const t = tones[i];
                const white = t !== "surface";
                return (
                  <Appear key={o.id} delay={0.1 * i} className={`flex flex-col items-start gap-[30px] overflow-hidden rounded-[10px] p-5 md:rounded-[30px] lg:p-[30px] ${t === "surface" ? "bg-surface" : t === "dark" ? "icon-dark" : "bg-[linear-gradient(135deg,#406ae4_0%,#5290f4_100%)]"}`}>
                    <div className="flex flex-col items-start gap-5">
                      <span className="flex size-[50px] items-center justify-center overflow-clip rounded-full bg-white ring-1 ring-inset ring-hairline">
                        <img src={o.flag} alt="" className="size-[30px] rounded-full" loading="lazy" decoding="async" />
                      </span>
                      <div className="flex flex-col items-start gap-[6px]">
                        <p className={`t-small ${white ? "text-white/70" : "text-muted"}`}>{o.label}</p>
                        <h3 className={`t-h4 ${white ? "!text-white" : ""}`}>{o.city}, {o.country}</h3>
                        <p className={`t-base ${t === "dark" ? "text-gray-text" : t === "blue" ? "text-hairline" : "text-muted"}`}>{o.address}</p>
                        {o.hours && <p className={`t-base ${white ? "text-white/70" : "text-muted"}`}>{o.hours}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <a href={o.tel} className={`t-base font-semibold underline underline-offset-4 ${white ? "text-white" : "text-ink"}`}>{o.phone}</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.address}, ${o.country}`)}`} target="_blank" rel="noopener" className={`t-base font-semibold underline underline-offset-4 ${white ? "text-white" : "text-ink"}`}>{openInMaps}</a>
                    </div>
                  </Appear>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="contents md:flex md:w-[349px] md:flex-col md:items-start md:gap-10 lg:w-[424px] lg:gap-[80px]">
              <div className="order-1 flex flex-col items-start gap-[10px] md:order-none">
                <h2 className="t-h2">{t("contact.faq.title", "Frequently asked questions")}</h2>
                <p className="t-body text-muted">{t("contact.faq.lead", "Common questions about programmes, scholarships and visas.")}</p>
              </div>
              <FaqCta faces={faces} className="order-3 md:order-none" />
            </Appear>
            <Appear delay={0.1} className="order-2 w-full flex-1 md:order-none">
              <Accordion items={allFaqs} />
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
