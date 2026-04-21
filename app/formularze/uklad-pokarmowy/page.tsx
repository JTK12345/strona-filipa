import type { Metadata } from "next";
import Link from "next/link";
import { DigestionReportForm } from "@/components/DigestionReportForm";

export const metadata: Metadata = {
  title: "Raport układ pokarmowy / jelita / trawienie",
  description:
    "Formularz raportu dotyczącego pracy układu pokarmowego, jelit i trawienia.",
};

export default function DigestionReportPage() {
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
            Układ pokarmowy / jelita / trawienie
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Cześć! Ten raport dotyczy pracy układu pokarmowego i jelit.
            </p>
            <p>
              Uzupełnij go dokładnie. Trawienie, wypróżnienia i reakcje
              pokarmowe są kluczowe dla metabolizmu, odporności, energii oraz
              regeneracji.
            </p>
            <p>Raport pozwala ocenić:</p>
            <ul className="grid gap-2">
              <li>• jak funkcjonują jelita,</li>
              <li>• co powoduje wzdęcia, zgagę, zaparcia lub biegunki,</li>
              <li>• które produkty wywołują reakcje,</li>
              <li>• skuteczność zaleceń żywieniowych,</li>
              <li>
                • dalsze kroki: błonnik, enzymy, eliminacje, probiotyki albo
                diagnostykę.
              </li>
            </ul>
            <p>
              Im dokładniej opiszesz objawy, tym precyzyjniej można dobrać
              dalsze działania.
            </p>
          </div>

          <DigestionReportForm />
        </div>
      </div>
    </section>
  );
}
