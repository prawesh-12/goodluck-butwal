import { SectionHead } from "@/components/inner";
import { PillButton } from "@/components/ui/button";

export function Empty({
  title,
  lead,
  href = "/contact/book-consultation",
  action = "Book a free consultation",
}: {
  title: string;
  lead: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-5 md:gap-[30px]">
      <SectionHead title={title} lead={lead} />
      <PillButton href={href} tone="dark">{action}</PillButton>
    </div>
  );
}
