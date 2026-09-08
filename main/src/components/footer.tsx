"use client";

import Link from "next/link";
import { SocialLinks } from "@/components/ui/bits";
import { gl, img } from "@/lib/assets";
import { company } from "@/lib/site";
import type { FooterColumn, SocialLink } from "@/server/queries/site";
import { Appear } from "@/components/ui/appear";
import { useOffice } from "@/components/office";

export type FooterText = { tagline: string; officesHeading: string; copyright: string };

export function Footer({ columns, socials, text }: { columns: FooterColumn[]; socials: SocialLink[]; text: FooterText }) {
  const { office, offices } = useOffice();
  const ordered = [...offices].sort((a, b) => Number(b.id === office) - Number(a.id === office));
  const heading = "text-[18px] font-semibold leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]";
  return (
    <footer className="relative flex flex-col items-center overflow-clip pt-[50px] md:pt-[100px]">
      <div aria-hidden className="absolute inset-0 z-0 overflow-clip">
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#fff_0%,#fff_0%,rgba(255,255,255,0.3)_14%,rgba(255,255,255,0)_100%)]" />
        <img src={img.footerBg} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 60%" }} loading="lazy" decoding="async" />
        {/* Bokeh along the bottom: a few soft light discs and a haze under the logo. */}
        <div className="absolute inset-x-0 bottom-0 z-[1] h-[38%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_100%)]" />
        <div className="absolute bottom-[4%] left-[8%] z-[1] size-[180px] rounded-full bg-white/50 blur-[40px]" />
        <div className="absolute bottom-[14%] left-[26%] z-[1] size-[90px] rounded-full bg-[#ffe9a8]/60 blur-[24px]" />
        <div className="absolute bottom-[8%] right-[14%] z-[1] size-[220px] rounded-full bg-white/45 blur-[50px]" />
        <div className="absolute bottom-[20%] right-[32%] z-[1] size-[70px] rounded-full bg-white/60 blur-[18px]" />
        <div className="absolute bottom-[2%] left-[48%] z-[1] size-[120px] rounded-full bg-[#ffe9a8]/45 blur-[32px]" />
      </div>
      <div className="container-x relative z-[1] flex w-full flex-col gap-[50px] md:gap-[70px]">
        <div className="grid w-full gap-[50px] lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] lg:gap-[60px]">
          <Appear className="flex max-w-[420px] flex-col items-start gap-5 md:gap-6">
            <Link href="/" aria-label="Goodluck Education and Migration, home" className="block h-10">
              <img src={gl.logo} alt="Goodluck Education and Migration" className="h-full w-auto object-contain" loading="lazy" decoding="async" />
            </Link>
            <h2 className="t-h3">{text.tagline}</h2>
            <a href={`mailto:${company.email}`} className="t-lead font-semibold text-ink transition-colors hover:text-muted">
              {company.email}
            </a>
            <SocialLinks links={socials} />
          </Appear>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-[30px] lg:col-span-4 lg:grid-cols-subgrid lg:gap-[60px]">
            {columns.map(({ title, links }) => (
              <div key={title} className="flex flex-col items-start gap-5 md:gap-6">
                <p className={heading}>{title}</p>
                <div className="flex flex-col items-start gap-4 md:gap-5">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="t-base text-ink/75 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-start gap-5 md:gap-6">
              <p className={heading}>{text.officesHeading}</p>
              <div className="flex flex-col items-start gap-4 md:gap-5">
                {ordered.map((o) => (
                  <div key={o.id} className="flex flex-col gap-[2px]">
                    <p className="t-base text-ink/75">{o.city}, {o.country}</p>
                    <a href={o.tel} className="t-base text-ink/75 transition-colors hover:text-ink">{o.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="t-base text-ink">{text.copyright.replace("{year}", String(new Date().getFullYear())).replace("{name}", company.name)}</p>
          <p className="t-base text-ink">{offices.find((o) => o.hours)?.hours}</p>
        </div>
      </div>
      <img
        src={gl.logo}
        alt=""
        aria-hidden
        className="relative z-[1] -mb-[2px] mt-[50px] w-[min(94vw,1320px)] opacity-80 brightness-0 invert select-none md:mt-[70px]" loading="lazy" decoding="async" />
    </footer>
  );
}
