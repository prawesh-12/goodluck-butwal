import type { Metadata } from "next";
import { InnerHero } from "@/components/inner";
import { TeamGrid } from "@/components/team-grid";
import { team } from "@/content/team";

export const metadata: Metadata = { title: "Our team", description: `${team.length} people across Australia, Nepal and the Philippines.` };

export default function TeamPage() {
  return (
    <>
      <InnerHero badge="Expert team members" title="Our team at your service" lead="We draw on our global network to assemble a team of experts." />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <TeamGrid />
        </div>
      </section>
    </>
  );
}
