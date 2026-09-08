import type { ReactNode } from "react";
import "../globals.css";
import { bricolage, interDisplay } from "@/lib/fonts";

export const metadata = { title: "Goodluck admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${interDisplay.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
