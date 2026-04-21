import { NextResponse } from "next/server";
import { readProtectedJson } from "@/app/api/_utils/form-security";
import { getString, isEmail, sendReportEmail } from "@/app/api/_utils/report-mail";

export const runtime = "nodejs";

type DigestionReportBody = {
  email?: unknown;
  fullName?: unknown;
  symptomsReduced?: unknown;
  bowelMovements?: unknown;
  bristolScale?: unknown;
  bloating?: unknown;
  abdominalPain?: unknown;
  reflux?: unknown;
  digestionQuality?: unknown;
  intolerances?: unknown;
  stoolOrUrineChanges?: unknown;
  supplements?: unknown;
};

const reportTitle = "Raport układ pokarmowy / jelita / trawienie";

const fieldLabels: Record<keyof DigestionReportBody, string> = {
  email: "Adres e-mail",
  fullName: "Imię i nazwisko",
  symptomsReduced: "Czy zmniejszyły się objawy związane z układem pokarmowym?",
  bowelMovements: "Ilość wypróżnień na dobę",
  bristolScale: "Konsystencja (skala Bristol)",
  bloating: "Wzdęcia (tak/nie + godzina)",
  abdominalPain: "Ból brzucha (lokalizacja + skala 1-10)",
  reflux: "Refluks (kiedy, po czym)",
  digestionQuality: "Jakość trawienia po 3 głównych posiłkach",
  intolerances: "Nietolerancje / reakcje po konkretnych produktach",
  stoolOrUrineChanges:
    "Czy stolec lub mocz miały niepokojące zmiany (kolor, zapach, pienienie)?",
  supplements: "Ile pozostało suplementów? Czy wystarczy na kolejny tydzień?",
};

export async function POST(req: Request) {
  try {
    const protectedJson = await readProtectedJson<DigestionReportBody>(req);

    if (protectedJson.error) {
      return protectedJson.error;
    }

    const body = protectedJson.body;
    const report = Object.fromEntries(
      Object.keys(fieldLabels).map((key) => [
        key,
        getString(body[key as keyof DigestionReportBody]),
      ])
    ) as Record<keyof DigestionReportBody, string>;

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
    console.error("Błąd wysyłki raportu układu pokarmowego:", error);

    const message =
      error instanceof Error && error.message === "missing_smtp_config"
        ? "Formularz nie jest jeszcze skonfigurowany."
        : "Nie udało się wysłać raportu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
