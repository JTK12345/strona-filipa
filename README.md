# Swiadomy Profil Ciala

Platforma gabinetu i jednorazowo platnych kursow wideo. Aplikacja laczy
publiczny katalog, konta uzytkownikow, chronione filmy z VPS, notatki, postep,
zamowienia Przelewy24 oraz panel administratora.

## Stan projektu

Gotowe w kodzie:

- rejestracja, logowanie i sesje bazodanowe,
- publiczny katalog kursow z cenami z PostgreSQL,
- zakup jednego kursu przez Przelewy24,
- podpisy SHA-384, `testAccess`, rejestracja i weryfikacja transakcji,
- idempotentny callback P24 i atomowe nadanie dostepu,
- prywatne filmy z obsluga HTTP Range,
- notatki i postep lekcji,
- historia zamowien uzytkownika,
- panel administratora, zdarzenia platnicze i audytowane nadanie dostepu,
- Docker Compose z PostgreSQL i siecia Nginx Proxy Manager.

Integracja P24 jest domyslnie wylaczona. Przed sprzedaza trzeba uzupelnic
finalny regulamin i polityke prywatnosci, skonfigurowac konto Sandbox, wykonac
testy z prawdziwymi danymi Sandbox i dopiero potem osobno zatwierdzic produkcje.

## Najwazniejsze adresy

- `/kursy` - publiczny katalog,
- `/kup` - wybor kursu i rozpoczecie platnosci,
- `/rejestracja` i `/logowanie` - konto uzytkownika,
- `/panel` - kursy i historia zamowien zalogowanego uzytkownika,
- `/panel/admin` - panel dostepny tylko dla administratora,
- `/biblioteka` - prywatna biblioteka,
- `/platnosc/sukces` - kontrolowany odczyt statusu lokalnego zamowienia,
- `/regulamin` i `/polityka-prywatnosci` - obecnie oznaczone projekty.

Panel i biblioteka nie sa pokazywane niezalogowanym osobom. Samo ukrycie linku
nie jest zabezpieczeniem: kazda trasa kursu, lekcji, notatek i filmu ponownie
sprawdza sesje oraz `access_grants` po stronie serwera.

## Architektura

- Next.js 16.2.2, App Router, React 19, TypeScript,
- PostgreSQL 16 i migracje SQL tylko do przodu,
- Docker Compose,
- Nginx Proxy Manager przez zewnetrzna siec Docker `proxy`,
- pliki wideo poza `public`, montowane tylko do odczytu,
- Przelewy24 REST API, Sandbox albo produkcja wybierane tylko przez `P24_ENV`.

Kontener aplikacji uruchamia migracje przed startem serwera. Baza i filmy nie sa
czescia obrazu aplikacji.

## Uruchomienie

Do pelnego uruchomienia potrzebny jest PostgreSQL. Najprosciej:

```bash
cp .env.example .env
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3010/api/health
```

Przed startem zmien wszystkie wartosci `replace-with-*` w `.env`.

Same testy i build:

```bash
npm install
npm test
npm run lint
npm run build
```

Przydatne polecenia:

```bash
npm run db:status
npm run db:create-admin
npm run db:set-video
npm run db:set-sales
```

## Platnosci

Frontend wysyla tylko identyfikator kursu i wymagane potwierdzenia zgody.
Backend ponownie pobiera cene, walute, tytul i stan sprzedazy z PostgreSQL.
Powrot uzytkownika z bramki nie oznacza zaplaty. Dostep powstaje dopiero po:

1. poprawnym podpisie notyfikacji,
2. zgodnosci sprzedawcy, sesji, kwoty, waluty i `orderId`,
3. sukcesie `PUT /transaction/verify`,
4. transakcyjnym zapisie `paid`, zdarzenia i `access_grants`.

Nie istnieje funkcja recznego oznaczania zakupu jako `paid`. Administrator moze
nadac kurs poza platnoscia, ale jest to osobny grant ze zrodlem `admin` i wpisem
w `admin_audit_events`.

## Dokumentacja

- [WGRAC_NA_VPS.md](./WGRAC_NA_VPS.md) - pierwsze wdrozenie, aktualizacja,
  backup, filmy, Nginx i Sandbox P24,
- [docs/platnosci-przelewy24.md](./docs/platnosci-przelewy24.md) - kontrakt i
  architektura platnosci,
- [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) - zabezpieczenia i bramki
  przed produkcja.
