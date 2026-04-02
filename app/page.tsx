import { Hero } from "@/components/sections/Hero";
import { Problems } from "@/components/sections/Problems";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { About } from "@/components/sections/About";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { ContactCTA } from "@/components/sections/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problems />
      <Process />
      <Services />
      <About />
      <Testimonials />
      <FAQ />
      <ContactCTA />
    </>
  );
}