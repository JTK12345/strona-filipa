# Swiadomy Profil Ciala

Platforma gabinetu, konsultacji, treningu zdrowia i prywatnej biblioteki
materialow edukacyjnych. Projekt nie obsluguje platnosci: administrator
tworzy konto admina, generuje kody dostepu oraz dodaje filmy, instrukcje i
pliki z panelu. Uzytkownik zaklada konto, wpisuje otrzymany kod i po
zalogowaniu widzi udostepnione materialy.

## Stan projektu

Gotowe w kodzie:

- rejestracja, logowanie i sesje bazodanowe,
- odswiezanie widoku sesji po powrocie do aktywnej karty,
- brak wysylki maili z formularzy; kontakt odbywa sie przez telefon, e-mail i
  Instagram,
- role `admin` i `user`,
- publiczny katalog kursow,
- aktywacja dostepu kodem,
- panel administratora do generowania i wylaczania kodow,
- panel administratora do dodawania, edycji i usuwania materialow biblioteki,
- upload MP4, WebM, PDF, DOCX, JPG i PNG na serwer,
- prywatne wydawanie plikow i filmow tylko dla kont z dostepem,
- prywatne filmy lekcji z obsluga HTTP Range,
- notatki i postep lekcji,
- reczne nadawanie dostepu do konkretnego kursu,
- Docker Compose z PostgreSQL i siecia Nginx Proxy Manager.

Sciezka uzytkownika prowadzi wylacznie przez kody dostepu. Dawne moduly
platnosci zostaly usuniete z kodu aplikacji.

## Najwazniejsze adresy

- `/dostep` - wpisanie kodu dostepu,
- `/rejestracja` i `/logowanie` - konto uzytkownika,
- `/panel` - materialy uzytkownika i link do aktywacji kodu,
- `/panel/admin` - kody, materialy, upload i reczne granty,
- `/biblioteka` - prywatna biblioteka po aktywacji kodu,
- `/kursy` - publiczny katalog kursow,
- `/regulamin` i `/polityka-prywatnosci` - dokumenty prawne z placeholderami
  danych dzialalnosci do uzupelnienia przed produkcja.

Panel i biblioteka nie sa pokazywane niezalogowanym osobom. Kazda trasa
materialow, lekcji, notatek i plikow ponownie sprawdza sesje oraz aktywny grant
po stronie serwera.

## Architektura

- Next.js 16.2.12, App Router, React 19, TypeScript,
- PostgreSQL 16 i migracje SQL tylko do przodu,
- Docker Compose,
- Nginx Proxy Manager przez zewnetrzna siec Docker `proxy`,
- pliki poza `public`, zapisywane w katalogu storage na VPS,
- kody w bazie jako SHA-256, bez mozliwosci odczytania kodu po utworzeniu.

Kontener aplikacji uruchamia migracje przed startem serwera. Baza i przeslane
pliki nie sa czescia obrazu aplikacji.

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
npm run db:ensure-default-admin
npm run db:create-admin
npm run db:set-video
```

## Domyslny administrator

Kontener po migracjach uruchamia `scripts/ensure-default-admin.mjs`. Konto jest
konfigurowane przez `.env`:

```env
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=replace-with-admin-password
```

Uzupelnij `DEFAULT_ADMIN_PASSWORD` w `.env` wlasnym haslem przed startem. Przy
kazdym starcie kontenera konto z `DEFAULT_ADMIN_EMAIL` zostanie ustawione jako
aktywny admin, a haslo zostanie zsynchronizowane z `DEFAULT_ADMIN_PASSWORD`.

Nowe konta z `/rejestracja` sa zawsze zwyklymi uzytkownikami. Administrator moze
nadac albo odebrac role admina w `/panel/admin`, sekcja `Użytkownicy`. Panel
pokazuje tez liczbe aktywnych kont z rola admina.

## Dostep i materialy

1. Administrator loguje sie do `/panel/admin`.
2. W sekcji kodow tworzy kod i przekazuje go uzytkownikowi.
3. Uzytkownik tworzy konto lub loguje sie na `/logowanie`.
4. Uzytkownik wpisuje kod na `/dostep`.
5. Po aktywacji widzi `/biblioteka` i przypisane materialy w `/panel`.

Materialy biblioteki dodaje sie w `/panel/admin`. Pliki sa zapisywane na
serwerze pod `LIBRARY_STORAGE_PATH`, a gdy ta zmienna jest pusta, pod
`VIDEO_STORAGE_PATH`. W Docker Compose domyslnie jest to `/data/videos`
montowane z `./data/videos`.

## Dokumentacja

- [WGRAC_NA_VPS.md](./WGRAC_NA_VPS.md) - pierwsze wdrozenie, aktualizacja,
  backup, storage, Nginx i panel admina,
- [instrukcja.txt](./instrukcja.txt) - skrocona aktualizacja VPS,
- [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) - zabezpieczenia i checklisty.
