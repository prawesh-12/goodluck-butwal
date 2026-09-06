import { gl } from "@/lib/assets";
import { partnerLogos } from "@/content/partners";
import { Appear } from "@/components/ui/appear";
import { PillButton } from "@/components/ui/button";
import { Badge, CheckRow } from "@/components/ui/bits";

// The visa pathways listed on the goodluck_main homepage.
const pathways = ["Entering & leaving from country", "Visas", "Country citizenship", "Settling in country", "Help & support"];

// Partner logos orbit the Goodluck mark, 22.5° apart, on the same ring as the reference.
const angles = [-91, -68.6, -46, -23.6, -1.07, 21.4, 44, 66.4];
// skip the first logo: it is a solid navy square and fights the white circles
const ring = partnerLogos.slice(1, 9);

function Orbit({ radius, icon, box }: { radius: number; icon: number; box: number }) {
  return (
    <div aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: box, height: box }}>
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const x = box / 2 + radius * Math.sin(rad) - icon / 2;
        const y = box / 2 - radius * Math.cos(rad) - icon / 2;
        return (
          <span key={a} className="absolute flex items-center justify-center overflow-clip rounded-full bg-white p-3" style={{ left: x, top: y, width: icon, height: icon }}>
            <img src={ring[i]} alt="" className="size-full object-contain" />
          </span>
        );
      })}
    </div>
  );
}

export function Offices() {
  return (
    <section id="visas" className="flex w-full flex-col items-center">
      <div className="container-x">
        <Appear className="relative flex w-full flex-col items-center gap-[30px] overflow-clip rounded-[10px] bg-surface p-5 md:gap-[50px] md:rounded-[30px] md:p-[50px] lg:p-[100px]">
          <div className="icon-dark relative z-[2] grid w-full items-center gap-[30px] overflow-clip rounded-[10px] p-5 md:grid-cols-[1.1fr_1fr] md:rounded-[20px] md:p-10 lg:p-[60px]">
            <div className="flex flex-col items-start gap-5 md:gap-[30px]">
              <div className="flex flex-col items-start gap-[10px]">
                <Badge tone="white" className="ring-1 ring-hairline">Migration</Badge>
                <h2 className="t-h2 !text-white">Fly your dream destination</h2>
                <p className="t-body text-gray-text">Apply for your visa now!</p>
              </div>
              <div className="flex flex-col items-start gap-[10px]">
                {pathways.map((t) => (
                  <CheckRow key={t} color="text-white">{t}</CheckRow>
                ))}
              </div>
              <PillButton href="/contact/book-consultation">Book a consultation</PillButton>
            </div>
            <div className="relative flex items-center justify-center md:justify-end">
              <img src={gl.plane} alt="" className="w-full max-w-[520px] object-contain" />
            </div>
          </div>
          <div className="relative z-0 flex h-[350px] w-full max-w-[1000px] flex-col items-center justify-center overflow-clip py-[50px] md:h-[400px] md:py-[120px] lg:h-[505px]">
            <div className="md:hidden"><Orbit radius={345} icon={60} box={750} /></div>
            <div className="hidden md:block"><Orbit radius={430} icon={80} box={940} /></div>
            <div className="relative flex max-w-[520px] flex-col items-center gap-[10px] md:gap-5 lg:gap-[30px]">
              <span className="flex size-20 items-center justify-center overflow-clip rounded-full bg-white shadow-[0_8px_16px_rgba(29,29,29,0.15)] md:size-[100px] lg:size-[130px]">
                <img src={gl.mark} alt="" className="size-[55%] object-contain" />
              </span>
              <h3 className="t-h4 max-w-[218px] text-center md:max-w-none">Official representative of 100+ colleges, universities and TAFE facilities</h3>
            </div>
          </div>
          <img aria-hidden src={gl.campus} alt="" className="pointer-events-none absolute -left-[10px] -right-[10px] bottom-0 z-[1] w-[calc(100%+20px)] max-w-none object-contain object-bottom" />
        </Appear>
      </div>
    </section>
  );
}
