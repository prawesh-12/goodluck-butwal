"use client";

import Link from "next/link";
import { gl, img } from "@/lib/assets";
import { company, footerLinks, offices } from "@/lib/site";
import { about } from "@/content/about";
import { FlatButton, PillButton } from "@/components/ui/button";
import { Appear } from "@/components/ui/appear";
import { useOffice } from "@/components/office";

export function Footer() {
  const { office } = useOffice();
  const ordered = [...offices].sort((a, b) => Number(b.id === office) - Number(a.id === office));
  return (
    <footer className="relative flex flex-col items-center pb-4 pt-[50px] md:py-[100px]">
      <div aria-hidden className="absolute inset-0 z-0 overflow-clip">
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#fff_0%,#fff_0%,rgba(255,255,255,0.3)_14%,rgba(255,255,255,0)_100%)]" />
        <img src={img.footerBg} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 0%" }} />
      </div>
      <div className="container-x relative z-[1]">
        <div className="flex flex-col items-center gap-[50px] md:gap-[100px]">
          <div className="flex w-full max-w-[600px] flex-col items-center gap-5 md:gap-[30px] lg:gap-10">
            <Appear className="flex flex-col items-center gap-[10px] text-center">
              <h2 className="t-h2">Ready to create your luck?</h2>
              <p className="text-[18px] font-medium leading-[23.4px] text-muted md:text-[20px] md:leading-[26px]">Make a free consultation with our expert team.</p>
            </Appear>
            <Appear delay={0.1} className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
              <PillButton href="/contact/book-consultation">Book a consultation</PillButton>
              <FlatButton href="/contact">Contact us</FlatButton>
            </Appear>
          </div>

          <div className="flex w-full flex-col items-center gap-5 overflow-clip rounded-2xl bg-white p-5 md:gap-[30px] md:rounded-[30px] md:p-[30px] lg:gap-[60px] lg:p-[100px]">
            <div className="grid w-full gap-[50px] lg:grid-cols-[340px_1fr] lg:gap-[100px]">
              <div className="flex flex-col items-start gap-5 lg:gap-10">
                <div className="flex flex-col items-start gap-4 md:gap-5">
                  <Link href="/" aria-label="Goodluck Education and Migration, home" className="block h-10">
                    <img src={gl.logo} alt="Goodluck Education and Migration" className="h-full w-auto object-contain" />
                  </Link>
                  <p className="t-body text-muted">{about.established}</p>
                </div>
                <FlatButton href={`mailto:${company.email}`} tone="dark">
                  {company.email}
                </FlatButton>
              </div>
              <div className="grid gap-10 md:grid-cols-4 md:gap-[30px]">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title} className="flex flex-col items-start gap-4 md:gap-5">
                    <p className="text-[18px] font-medium leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]">{title}</p>
                    <div className="flex flex-col items-start gap-3 md:gap-4">
                      {links.map((l) => (
                        <Link key={l.href} href={l.href} className="t-base text-muted transition-colors hover:text-ink">
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-col items-start gap-4 md:gap-5">
                  <p className="text-[18px] font-medium leading-[23.4px] text-ink md:text-[20px] md:leading-[26px]">Offices</p>
                  <div className="flex flex-col items-start gap-3 md:gap-4">
                    {ordered.map((o) => (
                      <div key={o.id} className="flex flex-col gap-[2px]">
                        <p className="t-base text-ink">{o.city}, {o.country}</p>
                        <a href={o.tel} className="t-base text-muted transition-colors hover:text-ink">{o.phone}</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-5 border-t border-hairline pt-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:pt-[30px]">
              <p className="t-base text-muted">© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
              <p className="t-base text-muted">{offices[1].hours}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
