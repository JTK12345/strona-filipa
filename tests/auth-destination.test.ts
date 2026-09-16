import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeAuthDestination } from "../app/lib/auth-destination";
import { getCourseAccessCta } from "../app/lib/course-access-cta";

test("keeps the course destination through the anonymous login flow", () => {
  const cta = getCourseAccessCta({
    slug: "course",
    isLoggedIn: false,
    hasAccess: false,
  });
  const destination = new URL(
    cta.href,
    "https://example.test",
  ).searchParams.get("next");
  assert.equal(sanitizeAuthDestination(destination), "/kursy");
});

test("preserves every existing allowed account destination", () => {
  for (const destination of ["/panel", "/biblioteka", "/dostep", "/kursy"]) {
    assert.equal(sanitizeAuthDestination(destination), destination);
  }
});

test("rejects external, encoded, ambiguous and unapproved redirect destinations", () => {
  for (const destination of [
    null,
    undefined,
    ["/kursy"],
    "https://example.test",
    "//example.test",
    "/\\example.test",
    "javascript:alert(1)",
    "/%2fexample.test",
    "/panel/admin",
    "/kursy?next=https://example.test",
    "/kursy/../panel/admin",
    " /kursy",
  ]) {
    assert.equal(sanitizeAuthDestination(destination), "/panel");
  }
});
