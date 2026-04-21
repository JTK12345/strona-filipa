import Link from "next/link";
import { siteConfig } from "@/content/site";

const links = [
  { href: "/#uslugi", label: "Usługi" },
  { href: "/#o-mnie", label: "O mnie" },
  { href: "/#faq", label: "FAQ" },
  { href: "/formularze", label: "Formularze" },
  { href: "/#kontakt", label: "Kontakt" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(239,231,211,0.96)] backdrop-blur">
      <div className="container-main flex min-h-[108px] flex-wrap items-center justify-between gap-x-8 gap-y-4 py-4 md:flex-nowrap md:py-0">
        <Link href="/" className="min-w-0 shrink no-underline md:shrink-0">
          <div className="flex flex-col">
            <span className="text-[1.55rem] font-extrabold leading-none tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.1rem]">
              Świadomy Profil Ciała
            </span>
            <span className="mt-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[0.78rem] sm:tracking-[0.24em]">
              Holistyczna opieka nad zdrowiem
            </span>
          </div>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-3 md:order-none md:w-auto md:flex-nowrap md:gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.98rem] font-semibold text-[var(--foreground)] transition-opacity hover:opacity-70 md:text-[1.05rem]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={siteConfig.bookingUrl}
          className="button-primary shrink-0 px-4 py-3 text-[0.86rem] font-extrabold sm:px-7 sm:py-4 sm:text-[0.95rem]"
        >
          Umów konsultację
        </a>
      </div>
    </header>
  );
}
