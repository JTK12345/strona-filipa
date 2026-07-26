export {
  containsHtml,
  createCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
  isEmail,
  isPhone,
  logFormSuccess,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  readProtectedForm,
  sanitizeHeaderValue,
} from "@/app/api/_utils/request-guards";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
