export type CourseAccessCtaState =
  | { label: "Przejdź do kursu"; href: string; kind: "owned" }
  | { label: "Aktywuj dostęp"; href: "/dostep"; kind: "activate" }
  | {
      label: "Zaloguj się, aby sprawdzić dostęp";
      href: "/logowanie?next=/kursy";
      kind: "login";
    };

export function getCourseAccessCta(input: {
  slug: string;
  isLoggedIn: boolean;
  hasAccess: boolean;
}): CourseAccessCtaState {
  if (input.hasAccess) {
    return {
      label: "Przejdź do kursu",
      href: `/panel/kursy/${input.slug}`,
      kind: "owned",
    };
  }

  if (input.isLoggedIn) {
    return {
      label: "Aktywuj dostęp",
      href: "/dostep",
      kind: "activate",
    };
  }

  return {
    label: "Zaloguj się, aby sprawdzić dostęp",
    href: "/logowanie?next=/kursy",
    kind: "login",
  };
}
