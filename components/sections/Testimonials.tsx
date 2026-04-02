import { testimonials } from "@/content/testimonials";

export function Testimonials() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <span className="eyebrow">Opinie</span>
        <h2 className="section-title max-w-2xl">
          Zaufanie buduje się nie obietnicami, tylko realną zmianą i dobrą współpracą.
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.author} className="card-surface p-7">
              <p className="text-lg leading-8 text-[var(--foreground)]">“{testimonial.text}”</p>
              <p className="mt-6 font-semibold">{testimonial.author}</p>
              <p className="text-sm text-[var(--muted)]">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}