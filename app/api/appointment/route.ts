import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Formularz umawiania konsultacji jest wylaczony. Skontaktuj sie telefonicznie lub mailowo.",
    },
    { status: 410 },
  );
}
