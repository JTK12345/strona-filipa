import { Hero } from "@/components/sections/Hero";
import { Problems } from "@/components/sections/Problems";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { About } from "@/components/sections/About";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Reveal } from "@/components/Reveal";

export default function HomePage() {
  return (
    <>
      <Reveal>
        <Hero />
      </Reveal>
      <Reveal delayMs={80}>
        <Problems />
      </Reveal>
      <Reveal delayMs={120}>
        <Process />
      </Reveal>
      <Reveal delayMs={160}>
        <Services />
      </Reveal>
      <Reveal delayMs={200}>
        <About />
      </Reveal>
      <Reveal delayMs={240}>
        <Testimonials />
      </Reveal>
      <Reveal delayMs={280}>
        <FAQ />
      </Reveal>
      <Reveal delayMs={320}>
        <ContactCTA />
      </Reveal>
    </>
  );
}
