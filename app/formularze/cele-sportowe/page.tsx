import type { Metadata } from "next";
import Link from "next/link";
import { SportsGoalsReportForm } from "@/components/SportsGoalsReportForm";

export const metadata: Metadata = {
  title: "Raport cele sportowe i treningowe",
  description:
    "Formularz raportu dotyczącego celów sportowych, treningów, intensywności i regeneracji.",
};

export default function SportsGoalsReportPage() {
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
            Cele sportowe i treningowe
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Cześć! Ten raport dotyczy Twoich celów sportowych i jakości
              treningów.
            </p>
            <p>
              Pomaga precyzyjnie dopasować obciążenia, objętość, intensywność i
              regenerację.
            </p>
            <p>Raport pozwala sprawdzić:</p>
            <ul className="grid gap-2">
              <li>• jak znosisz aktualny plan,</li>
              <li>• czy nie przeciążasz żadnych struktur,</li>
              <li>• jak zmienia się kondycja i siła,</li>
              <li>• czy technika wykonywanych ćwiczeń idzie w dobrą stronę,</li>
              <li>• czy ciało adaptuje się, czy potrzebuje zmian.</li>
            </ul>
            <p>
              Dzięki temu można prowadzić proces skutecznie i bezpiecznie, tak
              żeby efekty były szybkie, ale stabilne.
            </p>
          </div>

          <SportsGoalsReportForm />
        </div>
      </div>
    </section>
  );
}
