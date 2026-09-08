import type { ReactNode } from "react";
import { gl } from "@/lib/assets";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";

export function ErrorBlock({
  badge = "Something went wrong",
  code = "404",
  title = "Page not found",
  lead = "The page you are looking for doesn't exist or has been moved.",
  cta = "Back to home",
  action,
}: {
  badge?: string;
  code?: string;
  title?: string;
  lead?: string;
  cta?: string;
  action?: ReactNode;
} = {}) {
  return (
    <section className="flex w-full flex-col items-center pb-[30px] pt-32 md:pt-[158px] lg:pt-[188px]">
      <div className="w-full px-4 md:max-w-[860px] md:px-5 lg:px-[30px]">
        <Appear y={10} duration={0.6} className="relative flex flex-col items-center gap-[50px] overflow-clip rounded-[10px] bg-surface px-5 pb-[70px] pt-10 md:rounded-[30px] md:px-[50px] md:pb-[100px] md:pt-[50px] lg:px-[100px] lg:pb-[160px] lg:pt-[100px]">
          <div className="relative z-[2] flex w-full max-w-[520px] flex-col items-center gap-5 md:gap-[30px]">
            <Appear y={10} delay={0.1} duration={0.6} className="flex flex-col items-center gap-4 md:gap-5">
              <Badge tone="white" className="ring-1 ring-hairline">{badge}</Badge>
              <h1 className="t-404 text-center">{code}</h1>
              <div className="flex flex-col items-center gap-[2px] md:gap-[10px]">
                <h2 className="t-h2 text-center">{title}</h2>
                <p className="t-body text-center text-muted">{lead}</p>
              </div>
            </Appear>
            {action ?? <PillButton href="/" iconSide="left">{cta}</PillButton>}
          </div>
          <img aria-hidden src={gl.campus} alt="" className="pointer-events-none absolute -left-[10px] -right-[10px] bottom-[-40px] z-[1] w-[calc(100%+20px)] max-w-none object-contain object-top md:bottom-[-80px]" loading="lazy" decoding="async" />
        </Appear>
      </div>
    </section>
  );
}
