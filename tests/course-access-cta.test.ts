import assert from "node:assert/strict";
import { test } from "node:test";
import { getCourseAccessCta } from "../app/lib/course-access-cta";

test("shows course link when the user already has access", () => {
  assert.deepEqual(
    getCourseAccessCta({
      slug: "kregoslup-bez-przeciazen",
      isLoggedIn: true,
      hasAccess: true,
    }),
    {
      label: "Przejdź do kursu",
      href: "/panel/kursy/kregoslup-bez-przeciazen",
      kind: "owned",
    },
  );
});

test("asks logged-in users without access to activate a code", () => {
  assert.deepEqual(
    getCourseAccessCta({
      slug: "kregoslup-bez-przeciazen",
      isLoggedIn: true,
      hasAccess: false,
    }),
    {
      label: "Aktywuj dostęp",
      href: "/dostep",
      kind: "activate",
    },
  );
});

test("asks anonymous users to log in before checking access", () => {
  assert.deepEqual(
    getCourseAccessCta({
      slug: "kregoslup-bez-przeciazen",
      isLoggedIn: false,
      hasAccess: false,
    }),
    {
      label: "Zaloguj się, aby sprawdzić dostęp",
      href: "/logowanie?next=/kursy",
      kind: "login",
    },
  );
});
