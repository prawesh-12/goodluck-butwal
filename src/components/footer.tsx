"use client";

import Link from "next/link";
import { gl, img } from "@/lib/assets";
import { company, footerLinks, offices } from "@/lib/site";
import { about } from "@/content/about";
import { Appear } from "@/components/ui/appear";
import { useOffice } from "@/components/office";

export function Footer() {
  const { office } = useOffice();
  const ordered = [...offices].sort((a, b) => Number(b.id === office) - Number(a.id === office));
  const heading = "text-[18px] font-semibold leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]";
  return (
    <footer className="relative flex flex-col items-center overflow-clip pt-[50px] md:pt-[100px]">
      <div aria-hidden className="absolute inset-0 z-0 overflow-clip">
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#fff_0%,#fff_0%,rgba(255,255,255,0.3)_14%,rgba(255,255,255,0)_100%)]" />
        <img src={img.footerBg} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 60%" }} />
      </div>
      <div className="container-x relative z-[1] flex w-full flex-col gap-[50px] md:gap-[70px]">
        <div className="grid w-full gap-[50px] lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] lg:gap-[60px]">
          <Appear className="flex max-w-[420px] flex-col items-start gap-5 md:gap-6">
            <Link href="/" aria-label="Goodluck Education and Migration, home" className="block h-10">
              <img src={gl.logo} alt="Goodluck Education and Migration" className="h-full w-auto object-contain" />
            </Link>
            <div className="flex flex-col gap-3">
              <h2 className="t-h3">Ready to create your luck?</h2>
              <p className="t-body text-muted">{about.established}</p>
            </div>
            <a href={`mailto:${company.email}`} className="t-lead font-semibold text-ink transition-colors hover:text-muted">
              {company.email}
            </a>
          </Appear>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-[30px] lg:col-span-4 lg:grid-cols-subgrid lg:gap-[60px]">
            {Object.entries(footerLinks).map(([title, links]) => (
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
              <p className={heading}>Offices</p>
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
          <p className="t-base text-ink">© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <p className="t-base text-ink">{offices[1].hours}</p>
        </div>
      </div>
      <p aria-hidden className="relative z-[1] -mb-[4vw] mt-10 w-full select-none whitespace-nowrap text-center font-display text-[20vw] font-semibold leading-[0.8] tracking-[-0.04em] text-white/70">
        {company.short}
      </p>
    </footer>
  );
}
