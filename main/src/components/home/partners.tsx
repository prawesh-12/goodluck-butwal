import { Badge, Ticker } from "@/components/ui/bits";

// The 43 partner logos from goodluck_main, unnamed there too.
export function Partners({ logos, tone = "default", className = "" }: { logos: string[]; tone?: "default" | "dark" | "gray"; className?: string }) {
  const line = tone === "gray" ? "bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,#bababa_50%,rgba(255,255,255,0)_100%)]" : "hairline-fade";
  return (
    <section className={`flex w-full flex-col items-center ${className}`}>
      <div className="w-full px-4 md:px-[30px]">
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-[30px] pb-[30px]">
          <div className="pointer-events-none absolute bottom-[10px] left-0 top-10 z-[1] w-[50px] bg-[linear-gradient(90deg,#fff_0%,rgba(255,255,255,0)_100%)] md:w-20" />
          <div className="pointer-events-none absolute bottom-[10px] right-0 top-10 z-[1] w-[50px] bg-[linear-gradient(270deg,#fff_0%,rgba(255,255,255,0)_100%)] md:w-20" />
          <div className="relative flex w-full items-center justify-center">
            <div aria-hidden className={`${line} absolute inset-x-0 top-1/2 h-px`} />
            {tone === "dark" ? (
              <span className="btn-black-sm relative inline-flex h-[38px] items-center rounded-full px-5 text-[14px] font-medium leading-[18.2px] text-white ring-1 ring-hairline">Our partners</span>
            ) : (
              <Badge className="relative ring-1 ring-hairline">Our partners</Badge>
            )}
          </div>
          <Ticker gap={50} speed={120} className="w-full [--gap-override:30px] md:[--gap-override:50px]">
            {logos.map((src) => (
              <img key={src} src={src} alt="Partner logo" className="h-9 w-auto max-w-[120px] shrink-0 object-contain" loading="lazy" decoding="async" />
            ))}
          </Ticker>
          <div aria-hidden className={`${line} absolute inset-x-0 bottom-0 h-px`} />
        </div>
      </div>
    </section>
  );
}
