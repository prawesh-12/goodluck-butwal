import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { InnerHero } from "@/components/shared/inner";
import { TeamGrid } from "@/features/team/components/team-grid";
import { listTeam } from "@/features/team/queries";
import { loadText } from "@/features/site-text/queries";

export async function generateMetadata(): Promise<Metadata> {
  const team = await listTeam();
  return buildMetadata({
    path: "/about/team",
    title: "Our team",
    description: `${team.length} people across Australia, Nepal and the Philippines.`,
  });
}

export default async function TeamPage() {
  const t = await loadText();
  const team = await listTeam();

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "About us", path: "/about" }, { name: "Our team", path: "/about/team" }])} />
      <InnerHero badge={t("about.team.badge", "Expert team members")} title={t("about.team.title", "Our team at your service")} lead={t("about.team.lead", "We draw on our global network to assemble a team of experts.")} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <TeamGrid team={team} />
        </div>
      </section>
    </>
  );
}
