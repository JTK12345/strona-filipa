import { NextResponse } from "next/server";
import {
  hashPassword,
  isSameOriginFormRequest,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  sanitizeAuthDestination,
} from "@/app/lib/auth";
import { queryDatabase } from "@/app/lib/db";
import { createSessionCookie, createUserSession } from "@/app/lib/session";

export const runtime = "nodejs";

type CreatedUserRow = {
  id: string;
};

function registrationRedirect(error: string, destination: string) {
  const searchParams = new URLSearchParams({ error, next: destination });
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/rejestracja?${searchParams.toString()}` },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginFormRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");
  const destination = sanitizeAuthDestination(formData.get("next"));

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return registrationRedirect("invalid", destination);
  }

  if (password !== passwordConfirmation) {
    return registrationRedirect("mismatch", destination);
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await queryDatabase<CreatedUserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (lower(email))
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         updated_at = now()
       WHERE users.password_hash IS NULL
         AND users.status = 'active'
       RETURNING id`,
      [email, passwordHash],
    );

    if (!result.rows[0]) {
      return registrationRedirect("exists", destination);
    }

    const token = await createUserSession(result.rows[0].id);
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: destination },
    });
    response.cookies.set(createSessionCookie(token));
    return response;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return registrationRedirect("exists", destination);
    }

    return registrationRedirect("server", destination);
  }
}
