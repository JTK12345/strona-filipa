import type { Metadata } from "next";
import Link from "next/link";
import { WeightLossReportForm } from "@/components/WeightLossReportForm";

export const metadata: Metadata = {
  title: "Raport redukcja masy ciała",
  description:
    "Formularz raportu dotyczącego redukcji masy ciała, metabolizmu, apetytu i wagi.",
};

export default function WeightLossReportPage() {
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
            Redukcja masy ciała
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Cześć! Ten raport dotyczy procesu redukcji, metabolizmu, apetytu
              i masy ciała.
            </p>
            <p>
              Wypełnij go szczerze. Dzięki temu można ocenić, jak organizm
              reaguje na deficyt, jak zmienia się apetyt, poziom sytości,
              energia i masa ciała.
            </p>
            <p>Raport pomaga:</p>
            <ul className="grid gap-2">
              <li>• ustalić, czy tempo redukcji jest zdrowe i stabilne,</li>
              <li>• sprawdzić, czy nie pojawiają się przeciążenia hormonalne lub stresowe,</li>
              <li>• korygować kaloryczność, makroskładniki i błonnik,</li>
              <li>
                • reagować, jeśli waga stoi, skacze lub spada zbyt szybko.
              </li>
            </ul>
            <p>
              Redukcja to precyzyjny proces, a każdy sygnał z organizmu ma
              znaczenie.
            </p>
          </div>

          <WeightLossReportForm />
        </div>
      </div>
    </section>
  );
}
