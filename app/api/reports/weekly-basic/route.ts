import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type WeeklyBasicReportBody = {
  email?: unknown;
  fullName?: unknown;
  nameAndPeriod?: unknown;
  recommendationsScore?: unknown;
  energyScore?: unknown;
  trainingUnits?: unknown;
  complementaryTraining?: unknown;
  sleepScore?: unknown;
  nutritionScore?: unknown;
  stressScore?: unknown;
  averageSteps?: unknown;
  closerToGoal?: unknown;
  biggestSuccess?: unknown;
  biggestDifficulty?: unknown;
  needsChange?: unknown;
};

const reportTitle = "Tygodniowy raport współpracy - podstawowy";

const fieldLabels: Record<keyof WeeklyBasicReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  nameAndPeriod: "Okres składania raportu",
  recommendationsScore: "Realizacja zaleceń w tym tygodniu (1-10)",
  energyScore: "Średnia energia w ciągu dnia (1-10)",
  trainingUnits: "Jednostki treningowe wykonane w tym tygodniu",
  complementaryTraining: "Czy wykonano trening uzupełniający?",
  sleepScore: "Sen w tym tygodniu (1-10)",
  nutritionScore: "Jakość żywienia w tym tygodniu (1-10)",
  stressScore: "Poziom stresu (1-10)",
  averageSteps: "Tygodniowa dzienna średnia ilość kroków",
  closerToGoal: "Czy osoba czuje, że jest bliżej głównego celu?",
  biggestSuccess: "Największy sukces w tym tygodniu",
  biggestDifficulty: "Największa trudność",
  needsChange: "Czy potrzebna jest zmiana, korekta lub wyjaśnienie?",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<WeeklyBasicReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof WeeklyBasicReportBody]),
      ])
    ) as Record<keyof WeeklyBasicReportBody, string>;

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
      subject: `Tygodniowy raport współpracy: ${report.fullName} (${report.nameAndPeriod})`,
      replyTo: report.email,
      fullName: report.fullName,
      fieldLabels,
      report,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki podstawowego raportu tygodniowego:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
