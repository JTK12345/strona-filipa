import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentForm } from "@/components/AppointmentForm";

export const metadata: Metadata = {
  title: "Umow wizyte",
  description: "Formularz do umowienia wizyty lub rozmowy zwrotnej.",
};

export default function AppointmentPage() {
  return (
    <section className="section bg-white">
      <div className="container-main">
        <div className="mb-10">
          <Link className="button-back" href="/#kontakt">
            <span aria-hidden="true">&larr;</span>
            <span>Powrot</span>
          </Link>
        </div>

        <div className="soft-panel p-6 md:p-10">
          <span className="eyebrow">Wizyta</span>
          <h1 className="section-title max-w-4xl">
            Zostaw kontakt i napisz, kiedy najlepiej sie odezwac.
          </h1>
          <div className="section-lead grid gap-5">
            <p>
              Wypelnij krotki formularz, a oddzwonimy lub odpiszemy, aby ustalic
              dogodny termin wizyty albo rozmowy.
            </p>
            <p>
              Wystarczy podac podstawowe dane kontaktowe i preferowana pore
              kontaktu. Szczegoly omowimy juz bezposrednio.
            </p>
          </div>

          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
