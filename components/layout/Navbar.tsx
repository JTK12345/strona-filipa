import Link from "next/link";
import { getCurrentAccessSession } from "@/app/lib/access";
import { siteConfig } from "@/content/site";

const publicLinks = [
  { href: "/#uslugi", label: "Cennik" },
  { href: "/kursy", label: "Kursy" },
  { href: "/kup", label: "Kup dostęp" },
];

const privateLinks = [
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/panel", label: "Panel" },
];

export async function Navbar() {
  const session = await getCurrentAccessSession();
  const links = session ? [...publicLinks, ...privateLinks] : publicLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,248,242,0.92)] backdrop-blur">
      <div className="container-main flex min-h-[92px] flex-wrap items-center justify-between gap-x-8 gap-y-4 py-4 lg:flex-nowrap lg:py-0">
        <Link href="/" className="min-w-0 shrink no-underline lg:shrink-0">
          <div className="flex flex-col">
            <span className="text-[1.35rem] font-black leading-none text-[var(--foreground)] sm:text-[1.75rem]">
              {siteConfig.name}
            </span>
            <span className="mt-2 text-[0.67rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[0.74rem]">
              Gabinet · ruch · kursy wideo
            </span>
          </div>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-3 lg:order-none lg:w-auto lg:flex-nowrap lg:gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.95rem] font-semibold text-[var(--foreground)] transition-opacity hover:opacity-70"
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
