import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/components/seo/schema";
import { InnerHero } from "@/components/inner";
import { TeamGrid } from "@/components/team-grid";
import { listTeam } from "@/server/queries/people";
import { loadText } from "@/server/queries/text";

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
