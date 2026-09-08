import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { InnerHero } from "@/components/inner";
import { TeamGrid } from "@/components/team-grid";
import { listTeam } from "@/server/queries/people";

export async function generateMetadata(): Promise<Metadata> {
  const team = await listTeam();
  return buildMetadata({
    path: "/about/team",
    title: "Our team",
    description: `${team.length} people across Australia, Nepal and the Philippines.`,
  });
}

export default async function TeamPage() {
  const team = await listTeam();

  return (
    <>
      <InnerHero badge="Expert team members" title="Our team at your service" lead="We draw on our global network to assemble a team of experts." />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <TeamGrid team={team} />
        </div>
      </section>
    </>
  );
}
