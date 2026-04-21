import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: siteConfig.metaTitle,
  description: siteConfig.metaDescription,
  keywords: [
    "fizjoterapia Gdynia",
    "terapia manualna Gdynia",
    "trening zdrowia Gdynia",
    "masaż Gdynia",
    "Świadomy Profil Ciała",
    "Filip Proniewicz",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <ScrollProgress />
        <div className="site-shell">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
