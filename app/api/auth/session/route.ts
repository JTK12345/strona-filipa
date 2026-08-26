import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentUserSession();

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      role: session?.role ?? null,
      hasAnyAccess: session?.hasAnyAccess ?? false,
      hasLibraryAccess: session?.hasLibraryAccess ?? false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
