import { SectionHead } from "@/components/inner";
import { loadText } from "@/server/queries/text";
import { PillButton } from "@/components/ui/button";

export async function Empty({
  title,
  lead,
  href = "/contact/book-consultation",
  action,
}: {
  title: string;
  lead: string;
  href?: string;
  action?: string;
}) {
  const t = await loadText();
  return (
    <div className="flex w-full flex-col items-center gap-5 md:gap-[30px]">
      <SectionHead title={title} lead={lead} />
      <PillButton href={href} tone="dark">{action ?? t("empty.cta", "Book a free consultation")}</PillButton>
    </div>
  );
}
