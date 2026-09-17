# Zabezpieczenia aplikacji

## Zastosowane kontrole

- sesje w losowym cookie `HttpOnly`, `SameSite=Strict`, `Secure` na produkcji; produkcja uzywa prefiksu `__Host-`,
- w bazie jest tylko SHA-256 tokenu sesji,
- hasla sa hashowane bcrypt z kosztem 12,
- scisle sprawdzanie Host i Origin dla operacji przegladarki,
- limity rozmiaru i dozwolonych pol formularzy,
- CSRF, honeypot i Cloudflare Turnstile dla formularzy publicznych,
- limitowanie formularzy, logowania, rejestracji, kodow i operacji admina,
- CSP z nonce, HSTS i pozostale naglowki bezpieczenstwa,
- brak danych SMTP, hasel, kodow jawnych i tresci formularzy w logach,
- aplikacja dostepna na hoscie tylko przez `127.0.0.1:3010`,
- PostgreSQL bez opublikowanego portu,
- pliki poza `public`, wydawane przez endpoint z kontrola sesji,
- kody dostepu zapisywane w bazie tylko jako SHA-256,
- kody moga miec limit uzyc, date wygasniecia i blokade administracyjna,
- oddzielenie grantu administratora od aktywacji kodem,
- dziennik `admin_audit_events` dla recznych grantow.

## Zmienne produkcyjne i administrator

W produkcji wymagane sa co najmniej: `DATABASE_URL`, `APP_URL`,
`ALLOWED_ORIGINS`, `TRUSTED_PROXY_SECRET`, `LOG_SALT`,
`DEFAULT_ADMIN_EMAIL` i `DEFAULT_ADMIN_PASSWORD`. `APP_URL` musi byc
poprawnym originem HTTPS i musi dokladnie wystepowac w `ALLOWED_ORIGINS`.
W przeciwnym razie wysylka linkow resetowania hasla jest bezpiecznie blokowana.
Naglowki `Host`, `X-Forwarded-Host` i `X-Forwarded-Proto` nie sa uzywane do
budowania linkow produkcyjnych.

Bootstrap administratora jest idempotentny: przy starcie kontenera tworzy konto
tylko wtedy, gdy adres e-mail jeszcze nie istnieje. Istniejace konto, jego haslo,
rola i status nigdy nie sa automatycznie zmieniane. Haslo pierwszego konta musi
miec 12-128 znakow oraz mala i wielka litere, cyfre i symbol.

## Upload plikow

Panel administratora przyjmuje tylko wybrane typy:

- `video/mp4`,
- `video/webm`,
- `application/pdf`,
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
- `image/jpeg`,
- `image/png`.

Limit pojedynczego uploadu wynosi 600 MB. Pliki sa zapisywane pod
`LIBRARY_STORAGE_PATH`, a gdy ta zmienna jest pusta, pod `VIDEO_STORAGE_PATH`.
Sciezka jest normalizowana i sprawdzana tak, aby nie wyjsc poza katalog storage.
Nazwa magazynowa zawsze zawiera losowy UUID. Rozszerzenie, zadeklarowany MIME
oraz sygnatura pliku musza byc zgodne; DOCX jest sprawdzany jako pakiet Office
ZIP, a uszkodzone pliki sa odrzucane. Nazwy pobieran plikow sa oczyszczane i
wysylane przez bezpieczny `Content-Disposition` z `filename*`.

Materialy nie sa w `public`. Pobranie pliku i odtworzenie filmu wymaga aktywnej
sesji oraz dostepu do biblioteki.

## Health check

Publiczny endpoint `/api/health` zwraca tylko `{ "status": "ok" }` albo
ogolny status niedostepnosci z HTTP 503. Nie ujawnia nazw hostow, portow,
polaczenia z baza ani szczegolow bledow.

## Weryfikacja e-mail

Rejestracja nie tworzy sesji. Wysyla jednorazowy link aktywacyjny wazny przez
24 godziny; w bazie przechowywany jest wyłącznie SHA-256 tokenu. Ponowne
wyslanie uniewaznia poprzedni link, a login jest blokowany do czasu ustawienia
`email_verified_at`. Endpoint ponownej wysylki zawsze zwraca ten sam komunikat,
aby nie ujawniac, czy adres ma konto.

## Kody dostepu

Jawny kod jest pokazywany tylko raz po utworzeniu. W bazie zostaje `code_hash`.
Redeem dziala w transakcji z blokada rekordu kodu, wiec rownolegle uzycia nie
powinny przekroczyc `max_uses`.

Kod moze byc:

- jednorazowy albo wielokrotnego uzycia,
- ograniczony data waznosci,
- wylaczony przez administratora.

Wylaczenie kodu blokuje kolejne aktywacje, ale nie cofa juz nadanych grantow.
Jesli potrzebne bedzie cofanie dostepu, nalezy dodac osobna funkcje do
zarzadzania `access_grants.revoked_at`.

## Reverse proxy

Next.js 16 nie udostepnia Route Handlerom bezposredniego peer IP. Aplikacja ufa
forwardowanym naglowkom tylko wtedy, gdy Nginx Proxy Manager doda poprawny
`X-Trusted-Proxy-Secret`. Nginx ma nadpisywac `X-Real-IP` i
`X-Forwarded-For` wartoscia `$remote_addr`, aby klient nie mogl podstawic
wlasnego adresu do limitowania.

Port hosta jest zwiazany z loopbackiem, ale firewall nadal powinien blokowac
niepotrzebne porty. Nginx powinien nadpisywac, a nie przepuszczac od klienta,
naglowek `X-Trusted-Proxy-Secret`.

## Rate limiting

Limiter aplikacyjny dziala w pamieci jednego procesu i ma limit liczby wpisow.
Resetuje sie po restarcie kontenera. Jest poprawny dla obecnej pojedynczej
instancji, ale nie zastapi limitow na brzegu. Cloudflare lub Nginx musi rowniez
egzekwowac limity produkcyjne; przy wielu instancjach wymagany jest wspoldzielony
magazyn (np. Redis).

## Backup i odtwarzanie

Wykonuj szyfrowane kopie PostgreSQL oraz katalogow `VIDEO_STORAGE_PATH` /
`LIBRARY_STORAGE_PATH` poza VPS-em. Ogranicz do nich dostep, okresl retencje i
regularnie testuj odtworzenie w odizolowanym srodowisku. Backup nie powinien
trafiac do Git ani do publicznego katalogu aplikacji.

## Audyt zaleznosci

Regularnie uruchamiaj:

```bash
npm audit --omit=dev
npm test
npm run lint
npm run build
```

Nie uzywaj `npm audit fix --force` bez sprawdzenia zmian Next.js, Reacta i
ESLint, bo moze to wymusic niezgodne wersje.

## Bramki przed produkcja

Przed pokazaniem platformy klientom sprawdz:

- finalny regulamin i polityka prywatnosci,
- odzyskiwanie hasla albo ustalona procedura recznej pomocy,
- decyzja o weryfikacji e-mail,
- monitoring bledow aplikacji,
- automatyczny backup PostgreSQL i katalogu storage poza VPS,
- test odtwarzania backupu,
- limitowanie na reverse proxy,
- konfiguracja firewall,
- poprawny naglowek zaufanego proxy,
- prawa zapisu do `VIDEO_STORAGE_HOST_PATH`.

Nie zapisuj sekretow w Git ani w dokumentacji.
