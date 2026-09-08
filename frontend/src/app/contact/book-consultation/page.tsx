import type { Metadata } from "next";
import { img } from "@/lib/assets";
import { officeById } from "@/lib/site";
import { Appear } from "@/components/ui/appear";
import { InnerHero } from "@/components/inner";
import { BookingForm } from "@/components/forms";
import { Partners } from "@/components/home/partners";

export const metadata: Metadata = { title: "Book an appointment", description: "Choose an office, a service and a time that suits you." };

export default function BookConsultationPage() {
  const au = officeById("au");
  return (
    <>
      <InnerHero bg="field" pb="pb-0" gap="gap-[30px] md:gap-10 lg:gap-[70px]" badge="Book a consultation" title="Book an appointment" lead="Choose an office, a service and a time that suits you." after={
        <Appear y={10} delay={0.1} duration={0.6} className="relative flex w-full flex-col items-start gap-10 overflow-clip rounded-[10px] bg-surface p-5 pb-[120px] md:rounded-[30px] md:p-[30px] md:pb-20 lg:p-10 lg:pb-[120px]">
          <div className="relative z-[2] w-full"><BookingForm /></div>
          <p className="relative z-[2] t-small text-muted">Questions? Call <a href={au.tel} className="font-semibold text-ink underline underline-offset-4">{au.phone}</a> for help.</p>
          <img aria-hidden src={img.pricingDeco} alt="" className="pointer-events-none absolute bottom-[-50px] right-[-30px] z-[1] w-[480px] max-w-none object-contain object-top md:w-[632px]" loading="lazy" decoding="async" />
        </Appear>
      } />
      <Partners className="pb-[30px] pt-[60px] md:pt-20 lg:pt-[100px]" />
    </>
  );
}
