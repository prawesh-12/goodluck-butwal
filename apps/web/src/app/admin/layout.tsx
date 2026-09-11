import type { ReactNode } from "react";
import "@/styles/globals.css";
import { bricolage, interDisplay } from "@/styles/fonts";

export const metadata = { title: "Goodluck admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`admin-root ${interDisplay.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
