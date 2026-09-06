import type { Metadata } from "next";
import { ErrorBlock } from "@/components/error-block";
export const metadata: Metadata = { title: "Page not found" };
export default function Page404() { return <ErrorBlock />; }
