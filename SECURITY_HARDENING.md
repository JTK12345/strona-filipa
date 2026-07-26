# Zabezpieczenia aplikacji

## Zastosowane kontrole

- sesje w losowym cookie `HttpOnly`, `SameSite=Lax`, `Secure` na produkcji,
- w bazie jest tylko SHA-256 tokenu sesji,
- hasla sa hashowane bcrypt z kosztem 12,
- scisle sprawdzanie Host i Origin dla operacji przegladarki,
- limity rozmiaru i dozwolonych pol formularzy,
- CSRF, honeypot i Cloudflare Turnstile dla formularzy publicznych,
- limitowanie formularzy, logowania, rejestracji, checkoutu i operacji admina,
- CSP z nonce, HSTS i pozostale naglowki bezpieczenstwa,
- brak danych SMTP, P24, hasel i tresci formularzy w logach,
- aplikacja dostepna na hoscie tylko przez `127.0.0.1:3010`,
- PostgreSQL bez opublikowanego portu,
- filmy poza `public`, montowane tylko do odczytu,
- podpis i `transaction/verify` przed nadaniem dostepu,
- transakcyjny i idempotentny callback platnosci,
- oddzielenie grantu administratora od statusu platnosci,
- dziennik `admin_audit_events`.

## Audyt zaleznosci

Na 27 lipca 2026 r. `npm audit --omit=dev` zwraca zero znanych podatnosci.
Next.js, Nodemailer oraz biblioteki runtime PostCSS i Sharp sa przypiete do
poprawionych wersji w `package-lock.json`.

Pelny audyt narzedzi deweloperskich moze nadal raportowac `brace-expansion`
uzywany przez ESLint 9. Nie jest on instalowany w produkcyjnym etapie obrazu i
nie przetwarza danych uzytkownikow. Wymuszenie `brace-expansion` 5 psuje API
pluginow ESLint, a ESLint 10 nie jest jeszcze objety deklarowanym zakresem
zgodnosci tych pluginow. Nalezy usunac ten wyjatek po wydaniu zgodnego zestawu
ESLint i `eslint-config-next`; nie uzywac `npm audit fix --force`.

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
instancji, ale nie zastapi limitow na brzegu. Przed wiekszym ruchem dodaj limity
w Nginx/Cloudflare albo wspoldzielony magazyn dla wielu instancji.

## Platnosci

Adres API jest wybierany tylko z dwoch stalych hostow:

- Sandbox: `https://sandbox.przelewy24.pl/api/v1`,
- produkcja: `https://secure.przelewy24.pl/api/v1`.

Frontend nie wysyla ceny. Callback P24 nie uzywa CSRF, bo nie jest formularzem
przegladarki; chronia go limit rozmiaru, scisly parser JSON, podpis SHA-384,
zgodnosc danych zamowienia i dodatkowa weryfikacja API.

`orderId` jest parsowany bez utraty precyzji i zapisywany jako tekst. Bledy P24
nie zwracaja tresci odpowiedzi operatora uzytkownikowi.

## Bramki przed produkcja

Kod nie oznacza jeszcze gotowosci prawnej i operacyjnej. Przed prawdziwa
sprzedaza wymagane sa:

- finalny regulamin i polityka prywatnosci,
- potwierdzenie zawarcia umowy wysylane na trwalym nosniku,
- zweryfikowane konto P24 i pelny test Sandbox,
- odzyskiwanie hasla oraz decyzja o weryfikacji e-mail,
- monitoring bledow i alarm dla nieprzetworzonych `payment_events`,
- automatyczny backup PostgreSQL i filmow poza VPS,
- test odtwarzania backupu,
- limitowanie na reverse proxy,
- przeglad konfiguracji firewall i naglowka zaufanego proxy.

Nie zapisuj sekretow w Git ani w dokumentacji. `P24_ENABLED=false` i
`sales_enabled=false` sa bezpiecznym stanem domyslnym.
