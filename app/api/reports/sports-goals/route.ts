import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type SportsGoalsReportBody = {
  email?: unknown;
  fullName?: unknown;
  trainingUnits?: unknown;
  intensity?: unknown;
  fatigue?: unknown;
  jointsReaction?: unknown;
  techniqueImproved?: unknown;
  complementaryExercises?: unknown;
  bestTrainingPart?: unknown;
};

const reportTitle = "Raport cele sportowe i treningowe";

const fieldLabels: Record<keyof SportsGoalsReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  trainingUnits: "Ile jednostek treningowych wykonano? Jakich?",
  intensity: "Ocena intensywności (1-10)",
  fatigue: "Zmęczenie powysiłkowe (1-10)",
  jointsReaction: "Jak reagowały stawy?",
  techniqueImproved: "Czy technika konkretnego ruchu się poprawiła?",
  complementaryExercises: "Czy wykonano ćwiczenia uzupełniające (mobilność/oddech)?",
  bestTrainingPart: "Co było najlepsze w treningach?",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<SportsGoalsReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof SportsGoalsReportBody]),
      ])
    ) as Record<keyof SportsGoalsReportBody, string>;

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
      subject: `${reportTitle}: ${report.fullName}`,
      replyTo: report.email,
      fullName: report.fullName,
      fieldLabels,
      report,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki raportu celów sportowych:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
