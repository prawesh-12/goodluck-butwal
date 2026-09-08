import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { listInstitutions } from "@/server/queries/catalogue";
import { InnerHero } from "@/components/inner";
import { InstitutionList } from "@/components/catalogue/institution-list";
import { Empty } from "@/components/catalogue/empty";
import { loadText } from "@/server/queries/text";

export async function generateMetadata(): Promise<Metadata> {
  const institutions = await listInstitutions();
  return buildMetadata({
    path: "/institutions",
    title: "Institutions",
    description: `${institutions.length} universities and colleges we work with.`,
  });
}

export default async function InstitutionsPage() {
  const [institutions, t] = await Promise.all([listInstitutions(), loadText()]);

  return (
    <>
      <InnerHero
        badge="Institutions"
        badgeTone="chip"
        title="Universities and colleges we work with"
        lead={institutions.length > 0 ? `${institutions.length} institutions across our study destinations.` : undefined}
        clouds={false}
      />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          {institutions.length > 0 ? (
            <InstitutionList institutions={institutions} />
          ) : (
            <Empty
              title={t("empty.institutions.title", "No institutions listed yet")}
              lead={t("empty.institutions.lead", "Tell us where you want to study and a counsellor will send you the options.")}
            />
          )}
        </div>
      </section>
    </>
  );
}
