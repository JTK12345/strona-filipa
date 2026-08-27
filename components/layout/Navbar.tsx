import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { siteConfig } from "@/content/site";

const publicLinks = [
  { href: "/", label: "Start" },
  { href: "/#uslugi", label: "Usługi" },
  { href: "/kursy", label: "Materiały" },
  { href: "/#o-mnie", label: "O mnie" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#kontakt", label: "Kontakt" },
];

export async function Navbar() {
  const session = await getCurrentAccessSession();
  const links = [
    ...publicLinks,
    ...(session ? [{ href: "/panel", label: "Panel" }] : []),
    ...(session?.role === "admin"
      ? [{ href: "/panel/admin", label: "Admin" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,248,242,0.92)] backdrop-blur">
      <div className="container-main flex min-h-[92px] flex-wrap items-center justify-between gap-x-4 gap-y-4 py-4 xl:flex-nowrap xl:py-0">
        <Link href="/" className="min-w-0 shrink no-underline xl:shrink-0">
          <div className="flex flex-col">
            <span className="text-[1.35rem] font-black leading-none text-[var(--foreground)] sm:text-[1.75rem]">
              {siteConfig.name}
            </span>
            <span className="mt-2 text-[0.67rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[0.74rem]">
              Konsultacje · ruch · edukacja
            </span>
          </div>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-3 xl:order-none xl:w-auto xl:flex-nowrap xl:gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-[0.92rem] font-semibold text-[var(--foreground)] transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {session ? (
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="button-secondary nav-access">
                Wyloguj
              </button>
            </form>
          ) : (
            <Link href="/logowanie" className="button-secondary nav-access">
              Logowanie
            </Link>
          )}
          <Link href={siteConfig.bookingUrl} className="button-primary nav-booking">
            Konsultacja
          </Link>
        </div>
      </div>
    </header>
  );
}
