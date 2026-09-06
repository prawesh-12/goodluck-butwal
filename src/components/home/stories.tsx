import { successStories } from "@/content/stories";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, Ticker } from "@/components/ui/bits";

// The twelve success-story graphics carry their own text, so each sits on a plain white plate and nothing else is added.
export function Stories() {
  return (
    <section id="success-stories" className="pb-section flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <Appear className="flex w-full max-w-[860px] flex-col items-center gap-[10px] px-4 md:px-5 lg:px-[30px]">
          <Badge className="ring-1 ring-hairline">Success stories</Badge>
          <h2 className="t-h2 text-center">Highly recommended</h2>
          <p className="t-body text-center text-muted">Visa grants and reviews shared by our clients.</p>
        </Appear>
        <Appear delay={0.1} className="relative w-full">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[60px] bg-[linear-gradient(90deg,#fff_0%,rgba(255,255,255,0)_100%)] md:w-[160px]" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[60px] bg-[linear-gradient(270deg,#fff_0%,rgba(255,255,255,0)_100%)] md:w-[160px]" />
          <Ticker gap={30} speed={140} className="w-full py-2">
            {successStories.map((s) => (
              <div key={s.image} className="shrink-0 rounded-[16px] bg-white p-[10px] shadow-[0_0_0_4px_rgba(221,229,237,0.7)] md:rounded-[24px]">
                <div className="size-[240px] overflow-clip rounded-[8px] bg-surface md:size-[320px] md:rounded-[16px]">
                  <img src={s.image} alt={s.alt} className="size-full object-cover" />
                </div>
              </div>
            ))}
          </Ticker>
        </Appear>
        <Appear delay={0.2}>
          <PillButton href="/success-stories" tone="dark">
            All success stories
          </PillButton>
        </Appear>
      </div>
    </section>
  );
}
