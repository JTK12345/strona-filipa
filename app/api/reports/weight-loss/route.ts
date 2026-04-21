import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type WeightLossReportBody = {
  email?: unknown;
  fullName?: unknown;
  nutritionBestWorst?: unknown;
  caloriesMaintained?: unknown;
  snacking?: unknown;
  eatingHoursMaintained?: unknown;
  dietDeviations?: unknown;
  hungerLevel?: unknown;
  appetiteAttacks?: unknown;
  waterIntake?: unknown;
  alcohol?: unknown;
  weeklyWeight?: unknown;
  waistCircumference?: unknown;
};

const reportTitle = "Raport redukcja masy ciała (metabolizm, apetyt, waga)";

const fieldLabels: Record<keyof WeightLossReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  nutritionBestWorst: "Co w żywieniu poszło najlepiej? Co najgorzej?",
  caloriesMaintained: "Czy utrzymano odpowiednią kaloryczność diety?",
  snacking: "Czy występowało podjadanie między posiłkami?",
  eatingHoursMaintained: "Czy utrzymano zalecane godziny jedzenia?",
  dietDeviations: "Liczba odstępstw od diety",
  hungerLevel: "Poziom głodu w skali 1-10",
  appetiteAttacks: "Napady apetytu (kiedy i jak często)",
  waterIntake: "Ile wody wypijano dziennie?",
  alcohol: "Czy alkohol był spożywany w tym tygodniu? Jeśli tak, ile razy?",
  weeklyWeight: "Waga tygodniowa",
  waistCircumference: "Obwód pasa",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<WeightLossReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof WeightLossReportBody]),
      ])
    ) as Record<keyof WeightLossReportBody, string>;

    if (Object.values(report).some((value) => !value)) {
      return NextResponse.json(
        { error: "Uzupełnij wszystkie wymagane pola raportu." },
        { status: 400 }
      );
    }

    if (!isEmail(report.email)) {
      return NextResponse.json({ error: "Podaj poprawny adres e-mail." }, { status: 400 });
    }

    await sendReportEmail({
      reportTitle,
      subject: `Raport redukcja masy ciała: ${report.fullName}`,
      replyTo: report.email,
      fullName: report.fullName,
      fieldLabels,
      report,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki raportu redukcji masy ciała:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
