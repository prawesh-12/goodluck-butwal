import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/components/seo/schema";
import { listUpcomingBatches } from "@/server/queries/test-prep";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { InnerHero } from "@/components/inner";
import { BatchTable } from "@/components/test-prep/batch-table";
import { loadText } from "@/server/queries/text";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/test-preparation/batches", title: "Upcoming batches" });
}

export default async function BatchesPage() {
  // Past batches never appear: the query only asks for the ones that have not started.
  const [batches, t] = await Promise.all([listUpcomingBatches(), loadText()]);

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Test preparation", path: "/test-preparation" }, { name: "Upcoming batches", path: "/test-preparation/batches" }])} />
      <InnerHero badge="Test preparation" title="Upcoming batches" width={1260} after={<BatchTable batches={batches} empty={t("empty.batches", "No batches are open for booking yet. Ask us about the next one.")} filters />} />

      <section className="flex w-full flex-col items-center pb-[30px] md:pb-[60px] lg:pb-[100px]">
        <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
          <Appear className="flex flex-col items-center gap-5 overflow-hidden rounded-[10px] bg-surface p-5 text-center md:rounded-[30px] md:p-10">
            <h2 className="t-h3">Still have questions?</h2>
            <PillButton href="/contact/book-consultation" tone="dark">
              Book an appointment
            </PillButton>
          </Appear>
        </div>
      </section>
    </>
  );
}
