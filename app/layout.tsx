import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { TurnstileScript } from "@/components/TurnstileScript";
import { SessionRevalidator } from "@/components/auth/SessionRevalidator";
import { HashScroller } from "@/components/HashScroller";
import { siteConfig } from "@/content/site";
import { PublicPage } from "@/components/layout/PublicPage";
import { landingFonts } from "@/components/sections/landing-fonts";

export const metadata: Metadata = {
  title: siteConfig.metaTitle,
  description: siteConfig.metaDescription,
  keywords: [
    "fizjoterapia Gdynia",
    "terapia manualna Gdynia",
    "trening zdrowia Gdynia",
    "kursy zdrowotne online",
    "kursy ruchowe online",
    "Świadomy Profil Ciała",
    "Filip Proniewicz",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="pl" data-scroll-behavior="smooth">
      <body>
        <TurnstileScript />
        <ScrollProgress />
        <div className="site-shell">
          <Navbar />
          <SessionRevalidator />
          <HashScroller />
          <PublicPage fontClass={landingFonts}>{children}</PublicPage>
          <Footer />
        </div>
      </body>
    </html>
  );
}
