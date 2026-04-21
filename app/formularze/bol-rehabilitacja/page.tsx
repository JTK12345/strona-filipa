import type { Metadata } from "next";
import Link from "next/link";
import { PainRehabReportForm } from "@/components/PainRehabReportForm";

export const metadata: Metadata = {
  title: "Raport ból / rehabilitacja / powrót po kontuzji",
  description:
    "Formularz raportu dotyczącego bólu, rehabilitacji, mobilności i powrotu po kontuzji.",
};

export default function PainRehabReportPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="mb-10">
          <Link className="button-back" href="/formularze">
            <span aria-hidden="true">←</span>
            <span>Powrót</span>
          </Link>
        </div>

        <div className="soft-panel p-6 md:p-10">
          <span className="eyebrow">Raport</span>
          <h1 className="section-title max-w-4xl">
            Ból / rehabilitacja / powrót po kontuzji
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Cześć! Ten raport dotyczy Twoich dolegliwości bólowych i procesu
              powrotu do pełnej sprawności.
            </p>
            <p>
              Wypełnij go dokładnie. Ból to ważny sygnał diagnostyczny, a bez
              szczegółów trudniej ocenić, jak reagują tkanki.
            </p>
            <p>Raport pomaga:</p>
            <ul className="grid gap-2">
              <li>• monitorować intensywność i charakter bólu,</li>
              <li>• ocenić, czy kierunek terapii i treningu jest właściwy,</li>
              <li>• wyłapać objawy alarmowe,</li>
              <li>• sprawdzić progres mobilności i funkcji,</li>
              <li>
                • zdecydować, czy potrzebna jest zmiana planu lub dodatkowa
                diagnostyka.
              </li>
            </ul>
            <p>
              Każda informacja zwiększa bezpieczeństwo i przyspiesza powrót do
              sprawności.
            </p>
          </div>

          <PainRehabReportForm />
        </div>
      </div>
    </section>
  );
}
