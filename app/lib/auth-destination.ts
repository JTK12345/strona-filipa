const allowedDestinations = new Set([
  "/biblioteka",
  "/panel",
  "/dostep",
  "/kursy",
]);

// A shared exact allowlist keeps form links and server redirects consistent.
export function sanitizeAuthDestination(value: unknown): string {
  return typeof value === "string" && allowedDestinations.has(value)
    ? value
    : "/panel";
}
