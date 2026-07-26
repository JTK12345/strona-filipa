import "server-only";

import { getCurrentUserSession } from "@/app/lib/session";

export async function getCurrentAccessSession() {
  return getCurrentUserSession();
}
