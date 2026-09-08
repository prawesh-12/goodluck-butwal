import type { Metadata } from "next";
import { gl } from "@/lib/assets";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { InnerHero } from "@/components/inner";

export const metadata: Metadata = { title: "Message from co-founders" };

export default function CoFoundersPage() {
  return (
    <>
      <InnerHero badge="Co-founders" title="Message from co-founders" lead={about.founders} />
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
                <p className="t-body text-muted">Co-founders</p>
              </div>
              <PillButton href="/about/team" tone="dark">Meet the team</PillButton>
            </Appear>
          </div>
        </div>
      </section>
    </>
  );
}
