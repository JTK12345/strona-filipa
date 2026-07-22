import "server-only";

import { cookies } from "next/headers";
import { accessCookieName, parseAccessToken } from "@/app/api/_utils/access-session";

export async function getCurrentAccessSession() {
  const cookieStore = await cookies();
  return parseAccessToken(cookieStore.get(accessCookieName)?.value);
}
