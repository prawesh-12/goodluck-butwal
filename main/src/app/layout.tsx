import type { Metadata } from "next";
import "./globals.css";
import { bricolage, interDisplay } from "@/lib/fonts";
import { company } from "@/lib/site";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { OfficeProvider } from "@/components/office";
import { listOffices } from "@/server/queries/offices";

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: { default: company.name, template: `%s – ${company.short}` },
  description: "Education counselling, visa guidance, scholarship guidance and IELTS coaching from offices in Melbourne, Butwal and Cebu.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { siteName: company.name, type: "website" },
};

// Published content is live within five minutes without a deploy. Admin routes opt out with
// force-dynamic.
export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const offices = await listOffices();

  return (
    <html lang="en" className={`${interDisplay.variable} ${bricolage.variable}`}>
      <body className="overflow-x-clip">
        <OfficeProvider offices={offices}>
          <SmoothScroll />
          <Nav />
          <main className="flex flex-col items-start">{children}</main>
          <Footer />
        </OfficeProvider>
      </body>
    </html>
  );
}
