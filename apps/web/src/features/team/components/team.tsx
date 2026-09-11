import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { loadText } from "@/features/site-text/queries";
import type { PublicMember } from "@/features/team/queries";
import { TeamGrid } from "@/features/team/components/team-grid";

export async function Team({ team }: { team: PublicMember[] }) {
  const t = await loadText();
  return (
    <section id="team" className="pb-section flex w-full flex-col items-center">
      <div className="container-x">
        <div className="flex flex-col items-start gap-[30px] md:gap-10 lg:gap-[50px]">
          <div className="flex w-full flex-col gap-[10px] md:flex-row md:items-end md:gap-[30px] lg:gap-[50px]">
            <Appear className="flex flex-1 flex-col items-start gap-[10px]">
              <Badge className="ring-1 ring-hairline">{t("home.team.badge", "Expert team members")}</Badge>
              <h2 className="t-h2">{t("home.team.title", "Our team at your service")}</h2>
            </Appear>
            <Appear delay={0.1} className="flex flex-col items-start md:items-end">
              <PillButton href="/about/team" tone="dark">
                {t("home.team.cta", "Whole team")}
              </PillButton>
            </Appear>
          </div>
          <TeamGrid team={team} />
        </div>
      </div>
    </section>
  );
}
