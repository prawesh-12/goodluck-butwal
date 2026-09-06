import type { Metadata } from "next";
import "./globals.css";
import { bricolage, interDisplay } from "@/lib/fonts";
import { company } from "@/lib/site";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { OfficeProvider } from "@/components/office";

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: { default: company.name, template: `%s – ${company.short}` },
  description: "Education counselling, visa guidance, scholarship guidance and IELTS coaching from offices in Melbourne, Butwal and Cebu.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { siteName: company.name, type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interDisplay.variable} ${bricolage.variable}`}>
      <body className="overflow-x-clip">
        <OfficeProvider>
          <SmoothScroll />
          <Nav />
          <main className="flex flex-col items-start">{children}</main>
          <Footer />
        </OfficeProvider>
      </body>
    </html>
  );
}
