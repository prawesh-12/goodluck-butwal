import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { img } from "@/config/assets";
import { officeById } from "@/config/site";
import { Appear } from "@/components/ui/appear";
import { InnerHero } from "@/components/shared/inner";
import { BookingForm } from "@/features/leads/components/forms";
import { Partners } from "@/features/partners/components/partners";
import { listPartnerLogos } from "@/features/partners/queries";
import { listOffices } from "@/features/offices/queries";
import { listServices } from "@/features/services/queries";
import { loadText } from "@/features/site-text/queries";
import { formText } from "@/features/site-text/form-text";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/contact/book-consultation",
    title: "Book an appointment",
    description: "Choose an office, a service and a time that suits you.",
  });
}

export default async function BookConsultationPage() {
  const [logos, offices, services, t, forms] = await Promise.all([
    listPartnerLogos(),
    listOffices(),
    listServices(),
    loadText(),
    formText(),
  ]);

  const au = officeById("au");
  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }, { name: "Book an appointment", path: "/contact/book-consultation" }])} />
      <InnerHero bg="field" pb="pb-0" gap="gap-[30px] md:gap-10 lg:gap-[70px]" badge={t("contact.booking.badge", "Book a consultation")} title={t("contact.booking.title", "Book an appointment")} lead={t("contact.booking.lead", "Choose an office, a service and a time that suits you.")} after={
        <Appear y={10} delay={0.1} duration={0.6} className="relative flex w-full flex-col items-start gap-10 overflow-clip rounded-[10px] bg-surface p-5 pb-[120px] md:rounded-[30px] md:p-[30px] md:pb-20 lg:p-10 lg:pb-[120px]">
          <div className="relative z-[2] w-full"><BookingForm offices={offices} services={services} text={forms} /></div>
          <p className="relative z-[2] t-small text-muted">{t("contact.booking.help_before_phone", "Questions? Call")} <a href={au.tel} className="font-semibold text-ink underline underline-offset-4">{au.phone}</a> {t("contact.booking.help_after_phone", "for help.")}</p>
          <img aria-hidden src={img.pricingDeco} alt="" className="pointer-events-none absolute bottom-[-50px] right-[-30px] z-[1] w-[480px] max-w-none object-contain object-top md:w-[632px]" loading="lazy" decoding="async" />
        </Appear>
      } />
      <Partners logos={logos} className="pb-[30px] pt-[60px] md:pt-20 lg:pt-[100px]" />
    </>
  );
}
