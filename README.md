# Swiadomy Profil Ciala

Strona gabinetu z katalogiem kursow wideo, biblioteka materialow i testowym panelem dostepu premium.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Strona bedzie dostepna pod `http://localhost:3000`.

## Obsluga wersji testowej

Najwazniejsze adresy:

- `/kursy` - katalog kursow,
- `/biblioteka` - biblioteka materialow,
- `/dostep` - opis dostepu premium,
- `/kup` - testowy zakup bez prawdziwej platnosci,
- `/logowanie` - logowanie administratora,
- `/panel` - panel osoby z aktywnym dostepem.

### Testowy zakup

1. Otworz `/kup`.
2. Wpisz adres e-mail.
3. Kliknij przycisk testowego zakupu.
4. Aplikacja utworzy sesje klienta i przeniesie do `/panel`.

W tym trybie nie jest pobierana zadna oplata.

### Dostep administratora

1. Otworz `/logowanie`.
2. Podaj dowolny poprawny adres e-mail.
3. Wpisz kod ustawiony w `ADMIN_ACCESS_CODE`.

Domyslny kod testowy to `admin-test-access`. Przed uruchomieniem produkcyjnym trzeba go zmienic razem z `ACCESS_SESSION_SECRET`.

## Docker i VPS

Docker Compose uruchamia:

- aplikacje Next.js jako `strona`,
- baze PostgreSQL jako `postgres` z trwalym volume,
- polaczenie aplikacji z zewnetrzna siecia `proxy` dla Nginx Proxy Manager.

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

Zakup jest obecnie symulowany. Przed produkcja trzeba podlaczyc operatora platnosci, zapis uprawnien w bazie oraz produkcyjny system kont uzytkownikow.
