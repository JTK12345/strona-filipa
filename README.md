# Swiadomy Profil Ciala

Strona gabinetu z katalogiem kursow wideo, kontami uzytkownikow, biblioteka
materialow i panelem dostepu premium.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Strona bedzie dostepna pod `http://localhost:3000`.

## Obsluga wersji testowej

Najwazniejsze adresy:

- `/kursy` - publiczny katalog kursow, widoczny bez logowania,
- `/biblioteka` - prywatna biblioteka materialow, dostepna po zalogowaniu,
- `/dostep` - opis dostepu premium,
- `/kup` - testowy zakup bez prawdziwej platnosci,
- `/rejestracja` - tworzenie konta uzytkownika,
- `/logowanie` - logowanie e-mailem i haslem,
- `/panel` - panel zalogowanego uzytkownika.

Po wylogowaniu linki `Biblioteka` i `Panel` nie sa widoczne w nawigacji. Panel
pojawia sie po zalogowaniu, a biblioteka dopiero po nadaniu aktywnego dostepu.
Bezposrednie wejscie do chronionej czesci wykonuje odpowiednie przekierowanie.

### Testowy zakup

1. Otworz `/kup`.
2. Wpisz adres e-mail.
3. Kliknij przycisk testowego zakupu.
4. Aplikacja zapisze testowy zakup i uprawnienie w PostgreSQL, utworzy sesje
   klienta i przeniesie do `/panel`.

W tym trybie nie jest pobierana zadna oplata. Mozna go wylaczyc przez
`ENABLE_TEST_CHECKOUT=false`.

Testowy dostep obejmuje panel kursow, lekcje wideo, biblioteke, notatki i materialy
praktyczne. Uzytkownik moze pozniej ustawic haslo przez rejestracje na ten sam e-mail.

### Dostep administratora

Konto administratora utworz w kontenerze aplikacji:

```bash
read -s ADMIN_PASSWORD
printf '%s' "$ADMIN_PASSWORD" | docker compose exec -T strona npm run db:create-admin -- --email admin@example.com --password-stdin
unset ADMIN_PASSWORD
```

Administrator loguje sie zwyklym formularzem `/logowanie` i ma dostep do panelu
oraz biblioteki bez zakupu. Haslo jest zapisywane jako hash bcrypt, a losowa sesja
jest przechowywana w bazie.

## Docker i VPS

Docker Compose uruchamia:

- aplikacje Next.js jako `strona`,
- baze PostgreSQL jako `postgres` z trwalym volume,
- polaczenie aplikacji z zewnetrzna siecia `proxy` dla Nginx Proxy Manager.

Przy kazdym starcie kontenera aplikacji migracje z `database/migrations` sa
wykonywane automatycznie przed uruchomieniem Next.js. Zastosowane migracje sa
zapisywane w tabeli `schema_migrations` i nie wykonuja sie ponownie.

Podstawowy model danych obejmuje:

- uzytkownikow i sesje,
- kursy, moduly oraz lekcje,
- materialy biblioteki,
- zakupy i zdarzenia operatora platnosci,
- uprawnienia do kursow i biblioteki,
- postep lekcji i notatki uzytkownikow.

Stan aplikacji i polaczenia z baza:

```bash
curl http://127.0.0.1:3010/api/health
docker compose exec strona node scripts/db-status.mjs
```

Pelna instrukcja pierwszego wdrozenia, konfiguracji `.env`, Nginx Proxy Manager oraz aktualizacji znajduje sie w [WGRAC_NA_VPS.md](./WGRAC_NA_VPS.md).

Szybka aktualizacja istniejacej instalacji:

```bash
cd /home/ubuntu/strona-filipa
git pull origin main
docker compose up -d --build
docker compose ps
```

Aplikacja jest wystawiona na hoscie pod `http://127.0.0.1:3010`, a Nginx Proxy Manager laczy sie z kontenerem `strona-filipa-strona-1` na porcie `3000`.

## Stan platnosci

Zakup jest obecnie symulowany, ale konto, transakcja, sesja i uprawnienie sa
zapisywane w PostgreSQL. Przed produkcja trzeba wylaczyc testowy checkout i
podlaczyc operatora platnosci oraz jego webhook.

Audyt i etapowy plan integracji z Przelewy24 znajduja sie w
[docs/platnosci-przelewy24.md](./docs/platnosci-przelewy24.md). Konfiguracja P24
jest domyslnie wylaczona przez `P24_ENABLED=false`.
