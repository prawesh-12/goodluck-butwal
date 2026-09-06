import { gl, img } from "@/lib/assets";
import { offices } from "@/lib/site";
import { team } from "@/content/team";
import { googleRating } from "@/content/stories";
import { Appear } from "@/components/ui/appear";
import { Badge, SectionBg } from "@/components/ui/bits";

// Every number here is counted from goodluck_main, not typed in.
const cards = [
  { label: "Established", value: "2022", text: "Education and migration guidance since 2022.", tone: "light", pos: "lg:left-[50px] lg:top-[130px]", md: "", icon: 0 },
  { label: "Offices worldwide", value: String(offices.length), text: "Melbourne, Butwal and Cebu.", tone: "dark", pos: "lg:left-[920px] lg:top-[120px]", md: "", icon: 1 },
  { label: "Team members", value: String(team.length), text: "Counsellors, migration and admission staff across our offices.", tone: "light", pos: "lg:left-[920px] lg:top-[710px]", md: "md:order-4", icon: 2 },
  { label: "Google rating", value: googleRating.score, text: `Based on ${googleRating.count} client reviews.`, tone: "blue", pos: "lg:left-[460px] lg:top-[800px]", md: "md:order-3", icon: 3 },
  { label: "Partner institutions", value: "100+", text: "Colleges, institutions, universities and TAFE facilities we represent.", tone: "dark", pos: "lg:left-[20px] lg:top-[740px]", md: "md:order-5 md:col-span-2", icon: 4 },
] as const;

const tone = {
  light: { card: "bg-surface", label: "text-ink", value: "", text: "text-muted", icon: "bg-[linear-gradient(133deg,#406ae4_0%,#3b82f6_100%)]" },
  dark: { card: "icon-dark", label: "text-white", value: "!text-white", text: "text-gray-text", icon: "bg-white" },
  blue: { card: "bg-[linear-gradient(90deg,#406ae4_0%,#3b82f6_100%)]", label: "text-white", value: "!text-white", text: "text-surface", icon: "bg-black" },
};

export function Stats() {
  return (
    <section className="relative flex w-full flex-col items-center pt-[100px] md:pt-[160px] lg:pt-[100px]">
      <SectionBg src={gl.statsBg} top bottom>
        <div className="absolute inset-0 z-[1] bg-white/55" />
      </SectionBg>
      <div className="container-x relative z-[1]">
        <div className="relative flex w-full flex-col items-center justify-center gap-[30px] md:gap-10 lg:h-[1080px] lg:gap-[50px]">
          <Appear className="flex w-full max-w-[700px] flex-col items-center gap-[10px] lg:absolute lg:left-1/2 lg:top-[41%] lg:-translate-x-1/2 lg:-translate-y-1/2">
            <Badge className="ring-1 ring-hairline">Goodluck in numbers</Badge>
            <h2 className="t-h2 text-center">One brand, three offices</h2>
            <p className="t-body text-center text-muted">A growing team helping students and clients from Australia, Nepal and the Philippines.</p>
          </Appear>
          <div className="grid w-full gap-5 md:grid-cols-2 md:gap-[10px] lg:absolute lg:inset-0 lg:block">
            {cards.map((c, i) => {
              const t = tone[c.tone];
              return (
                <Appear key={c.label} delay={0.1 * i} className={`${c.md} lg:absolute lg:h-[280px] lg:w-[280px] ${c.pos}`}>
                  <div className={`flex flex-col justify-between overflow-hidden rounded-[10px] p-5 md:h-[250px] md:rounded-[30px] md:p-[30px] lg:h-[280px] ${t.card}`}>
                    <div className="flex items-start gap-[10px] pb-[30px]">
                      <p className={`t-base w-[154px] lg:w-[105px] ${t.label}`}>{c.label}</p>
                      <span className={`ml-auto flex size-10 shrink-0 items-center justify-center overflow-clip rounded-full ${t.icon}`}>
                        <img src={img.statIcons[c.icon]} alt="" className="size-5 object-contain" />
                      </span>
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <h3 className={`t-stat ${t.value}`}>{c.value}</h3>
                      <p className={`t-base ${t.text}`}>{c.text}</p>
                    </div>
                  </div>
                </Appear>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
