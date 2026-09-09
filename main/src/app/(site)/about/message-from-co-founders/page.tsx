import type { Metadata } from "next";
import { buildEntityMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbs } from "@/lib/seo/schema";
import { gl } from "@/config/assets";
import { getAboutContent } from "@/features/pages/queries";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { InnerHero } from "@/components/shared/inner";
import { loadText } from "@/features/site-text/queries";

export async function generateMetadata(): Promise<Metadata> {
  return buildEntityMetadata("page", "message-from-co-founders", {
    path: "/about/message-from-co-founders",
    title: "Message from co-founders",
  });
}

export default async function CoFoundersPage() {
  const [about, t] = await Promise.all([getAboutContent(), loadText()]);

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "About us", path: "/about" }, { name: "Message from co-founders", path: "/about/message-from-co-founders" }])} />
      <InnerHero badge={t("about.founders.role", "Co-founders")} title={t("about.founders.title", "Message from co-founders")} lead={about.founders} />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="flex flex-col gap-[30px] md:flex-row md:items-start lg:gap-[70px]">
            <Appear className="flex w-full flex-col items-start gap-10 overflow-clip rounded-[10px] bg-surface p-5 md:w-[465px] md:rounded-[30px] md:p-[30px] lg:w-[565px] lg:p-[50px]">
              <div className="aspect-[1128/1282] w-full overflow-clip rounded-[20px] shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                <img src={gl.founders} alt="Bimal Gurung and Kishor Gharti Magar" className="size-full object-cover" loading="lazy" decoding="async" />
              </div>
            </Appear>
            <Appear delay={0.1} className="flex flex-1 flex-col items-start gap-5 md:gap-[30px] lg:gap-10">
              <div className="flex flex-col items-start gap-[10px] md:gap-5">
                {about.coFounderMessage.map((t) => (
                  <p key={t.slice(0, 40)} className="t-body text-muted">{t}</p>
                ))}
              </div>
              <div className="flex flex-col items-start gap-1">
                <h2 className="t-h5">{about.founders}</h2>
                <p className="t-body text-muted">{t("about.founders.role", "Co-founders")}</p>
              </div>
              <PillButton href="/about/team" tone="dark">{t("about.mission.cta", "Meet the team")}</PillButton>
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
