import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { About } from "@/components/sections/About";
import { HelpWays } from "@/components/sections/HelpWays";
import { Academy } from "@/components/sections/Academy";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { landingFonts } from "@/components/sections/landing-fonts";
import styles from "@/components/sections/landing.module.css";
export default function HomePage() {
  return (
    <div className={`${styles.theme} ${landingFonts}`}>
      <Hero />
      <About />
      <HelpWays />
      <Services />
      <Testimonials />
      <Process />
      <Academy />
      <FAQ />
    </div>
  );
}
