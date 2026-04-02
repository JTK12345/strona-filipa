import { services } from "@/content/services";

export function Services() {
  return (
    <section id="uslugi" className="section bg-white">
      <div className="container-main">
        <span className="eyebrow">Usługi</span>
        <h2 className="section-title max-w-3xl">
          Współpraca dopasowana do Twojego problemu, celu i etapu, na którym jesteś.
        </h2>
        <p className="section-lead">
          Każda forma pracy opiera się na indywidualnym podejściu. Nie ma tu gotowych szablonów —
          jest analiza, praktyka i plan działania dopasowany do Ciebie.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="card-surface p-7">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-semibold">{service.title}</h3>
                <span className="rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-bold text-[var(--accent)]">
                  {service.price}
                </span>
              </div>
              <p className="mt-4 leading-7 text-[var(--muted)]">{service.description}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--muted)]">
                {service.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}