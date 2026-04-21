import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type PainRehabReportBody = {
  email?: unknown;
  fullName?: unknown;
  painLocation?: unknown;
  painIntensity?: unknown;
  painTriggers?: unknown;
  painRelief?: unknown;
  rehabExercisesDone?: unknown;
  mobilityProgress?: unknown;
  exerciseCount?: unknown;
  trainingReaction?: unknown;
  rangeOfMotionImproved?: unknown;
  movementDiscomfort?: unknown;
  movementControlImproved?: unknown;
};

const requiredFields: Array<keyof PainRehabReportBody> = [
  "email",
  "fullName",
  "painLocation",
  "painIntensity",
  "rehabExercisesDone",
  "mobilityProgress",
  "exerciseCount",
  "trainingReaction",
  "rangeOfMotionImproved",
  "movementDiscomfort",
  "movementControlImproved",
];

const reportTitle = "Raport ból / rehabilitacja / powrót po kontuzji";

const fieldLabels: Record<keyof PainRehabReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  painLocation: "Czy wystąpił gdzieś ból? Jeśli tak to gdzie?",
  painIntensity: "Intensywność bólu (0-10)",
  painTriggers: "Co wywoływało ból?",
  painRelief: "Czy coś zmniejszyło ból?",
  rehabExercisesDone: "Czy wykonano zalecane ćwiczenia rehabilitacyjne?",
  mobilityProgress: "Postęp w mobilności (1-10)",
  exerciseCount: "Ile razy?",
  trainingReaction: "Reakcja na trening",
  rangeOfMotionImproved: "Czy zakres ruchu w problematycznych miejscach się poprawił?",
  movementDiscomfort: "Czy któryś ruch powodował dyskomfort?",
  movementControlImproved: "Czy czujesz większą kontrolę i świadomość ruchu?",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<PainRehabReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof PainRehabReportBody]),
      ])
    ) as Record<keyof PainRehabReportBody, string>;

    if (requiredFields.some((field) => !report[field])) {
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
      subject: `Raport ból / rehabilitacja: ${report.fullName}`,
      replyTo: report.email,
      fullName: report.fullName,
      fieldLabels,
      report,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki raportu bólu i rehabilitacji:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
