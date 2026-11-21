import type { Metadata } from "next";
import "./globals.css";
import Workspace from "./workspace";

export const metadata: Metadata = {
  title: "WellWise | Private well dashboard",
  description: "Review a private well-water lab report.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Workspace>{children}</Workspace>
      </body>
    </html>
  );
}
