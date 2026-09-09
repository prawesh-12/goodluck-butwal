import localFont from "next/font/local";
import { Bricolage_Grotesque } from "next/font/google";

// Inter Display is what Framer ships for body copy; it is not on Google Fonts, so the latin files are bundled.
export const interDisplay = localFont({
  src: [
    { path: "../assets/fonts/InterDisplay-Regular.woff2", weight: "400" },
    { path: "../assets/fonts/InterDisplay-Medium.woff2", weight: "500" },
    { path: "../assets/fonts/InterDisplay-SemiBold.woff2", weight: "600" },
    { path: "../assets/fonts/InterDisplay-Bold.woff2", weight: "700" },
  ],
  variable: "--font-inter-display",
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600"], variable: "--font-bricolage", display: "swap" });
