import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentForm } from "@/components/AppointmentForm";

export const metadata: Metadata = {
  title: "Umów konsultację",
  description:
    "Formularz zgłoszenia preferowanych terminów konsultacji.",
};

export default function AppointmentPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="mb-10">
          <Link className="button-back" href="/#kontakt">
            <span aria-hidden="true">←</span>
            <span>Powrót</span>
          </Link>
        </div>

        <div className="soft-panel p-6 md:p-10">
          <span className="eyebrow">Konsultacja</span>
          <h1 className="section-title max-w-4xl">
            Podaj terminy, w których możesz się spotkać.
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Wypełnij krótki formularz, a propozycje terminów trafią do osoby
              prowadzącej. Dzięki temu łatwiej od razu dopasować wizytę do
              Twojej dostępności.
            </p>
            <p>
              Podaj kilka możliwych dni i godzin. Jeśli sprawa jest pilna,
              zaznacz to w dodatkowych informacjach.
            </p>
          </div>

          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
