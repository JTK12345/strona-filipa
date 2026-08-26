import { faqItems } from "@/content/faq";

export function FAQ() {
  return (
    <section id="faq" className="section">
      <div className="container-main">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title max-w-2xl">
          Najczęstsze pytania o konsultacje, materiały i dostęp.
        </h2>

        <div className="faq-list mt-10">
          {faqItems.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>
                <span>{item.question}</span>
                <span className="faq-item__icon" aria-hidden="true" />
              </summary>
              <p className="mt-4 max-w-4xl leading-7 text-[var(--muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
