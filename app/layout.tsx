import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WellWise | Private well report reader",
  description: "Review a private well-water lab report.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
