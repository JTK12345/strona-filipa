import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type SleepStressReportBody = {
  email?: unknown;
  fullName?: unknown;
  sleepHours?: unknown;
  wakeUps?: unknown;
  fallingAsleepTime?: unknown;
  fallingAsleepDifficulty?: unknown;
  morningFeeling?: unknown;
  stressLevel?: unknown;
  stressAffectedEatingOrSleep?: unknown;
  relaxationTechniques?: unknown;
  motivation?: unknown;
  mood?: unknown;
  concentrationImproved?: unknown;
  libidoImproved?: unknown;
};

const reportTitle = "Raport sen / stres / regeneracja / układ nerwowy";

const fieldLabels: Record<keyof SleepStressReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  sleepHours: "Godziny snu (od-do)",
  wakeUps: "Liczba pobudek w nocy",
  fallingAsleepTime: "Czas zasypiania",
  fallingAsleepDifficulty: "Czy zasypianie było łatwe czy trudne?",
  morningFeeling: "Jakość porannego samopoczucia (1-10)",
  stressLevel: "Poziom stresu przez większość tygodnia (1-10)",
  stressAffectedEatingOrSleep: "Czy stres wpłynął na jedzenie lub sen?",
  relaxationTechniques: "Czy stosowano techniki obniżania napięcia? TAK/NIE Jakie?",
  motivation: "Motywacja do działania (1-10)",
  mood: "Ogólny nastrój przez tydzień (1-10)",
  concentrationImproved: "Czy poprawiła się koncentracja i jasność umysłu?",
  libidoImproved: "Czy zauważono poprawę libido?",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<SleepStressReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof SleepStressReportBody]),
      ])
    ) as Record<keyof SleepStressReportBody, string>;

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
      subject: `Raport sen / stres / regeneracja: ${report.fullName}`,
      replyTo: report.email,
      fullName: report.fullName,
      fieldLabels,
      report,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd wysyłki raportu snu i stresu:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
