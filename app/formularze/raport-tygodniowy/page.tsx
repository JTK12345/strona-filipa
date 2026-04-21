import type { Metadata } from "next";
import Link from "next/link";
import { WeeklyBasicReportForm } from "@/components/WeeklyBasicReportForm";

export const metadata: Metadata = {
  title: "Tygodniowy raport współpracy - podstawowy",
  description:
    "Podstawowy formularz tygodniowego raportu współpracy, treningu, żywienia, regeneracji i postępów.",
};

export default function WeeklyBasicReportPage() {
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
            Tygodniowy raport współpracy - podstawowy
          </h1>
          <div className="section-lead grid gap-5">
            <p>Cześć! Mam nadzieję, że tydzień minął Ci dobrze.</p>
            <p>
              Poświęć kilka minut i wypełnij ten raport. Dzięki temu można
              zobaczyć, jak przebiegały ostatnie dni, jak reaguje ciało, gdzie
              są postępy, a gdzie potrzebne jest wsparcie lub korekta planu.
            </p>
            <p>Raport pomaga:</p>
            <ul className="grid gap-2">
              <li>• dostosować treningi do aktualnego poziomu,</li>
              <li>• korygować plan żywieniowy i regenerację,</li>
              <li>• wychwycić przeciążenia, regresy lub pierwsze sygnały pogorszenia zdrowia,</li>
              <li>• szybko zareagować, zanim pojawią się większe problemy,</li>
              <li>• realnie ocenić, czy praca idzie we właściwym kierunku.</li>
            </ul>
            <p>
              Nie ma tu ocen. Raport jest narzędziem, które działa na Twoją
              korzyść.
            </p>
          </div>

          <WeeklyBasicReportForm />
        </div>
      </div>
    </section>
  );
}
