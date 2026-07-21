import { faqItems } from "@/content/faq";

export function FAQ() {
  return (
    <section id="faq" className="section">
      <div className="container-main">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title max-w-2xl">
          Najczęstsze pytania o kursy, konsultacje i dostęp.
        </h2>

        <div className="mt-10 space-y-4">
          {faqItems.map((item) => (
            <details key={item.question} className="card-surface p-6">
              <summary className="cursor-pointer list-none text-lg font-semibold">
                {item.question}
              </summary>
              <p className="mt-4 max-w-4xl leading-7 text-[var(--muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
