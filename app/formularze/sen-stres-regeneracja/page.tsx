import type { Metadata } from "next";
import Link from "next/link";
import { SleepStressReportForm } from "@/components/SleepStressReportForm";

export const metadata: Metadata = {
  title: "Raport sen / stres / regeneracja / układ nerwowy",
  description:
    "Formularz raportu dotyczącego jakości snu, stresu, regeneracji i układu nerwowego.",
};

export default function SleepStressReportPage() {
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
            Sen / stres / regeneracja / układ nerwowy
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Cześć! Ten raport dotyczy jakości snu, poziomu stresu i ogólnej
              regeneracji.
            </p>
            <p>
              To jeden z najważniejszych elementów procesu. Nawet najlepszy
              trening i dieta nie działają, jeśli układ nerwowy nie odpoczywa.
            </p>
            <p>Raport pomaga ocenić:</p>
            <ul className="grid gap-2">
              <li>• jakość i długość snu,</li>
              <li>• wybudzenia i trudności z zasypianiem,</li>
              <li>• poziom stresu i napięcia,</li>
              <li>• zdolność do regeneracji między treningami,</li>
              <li>• objawy przeciążenia układu nerwowego.</li>
            </ul>
            <p>
              Dzięki temu można dopasować intensywność wysiłku, techniki
              oddechowe, formy regeneracji i ograniczyć ryzyko przetrenowania.
            </p>
          </div>

          <SleepStressReportForm />
        </div>
      </div>
    </section>
  );
}
