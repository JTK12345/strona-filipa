# Plan wdrozenia platnosci Przelewy24

Dokument opisuje stan projektu z 27 lipca 2026 r. oraz etapowy plan wdrozenia
jednorazowych zakupow kursow. Integracja produkcyjna nie jest jeszcze aktywna.

## Status realizacji

- etapy 0 i 1: zakonczone,
- etap 2: kod i migracja gotowe, oczekuja na wdrozenie na VPS,
- etapy 3-9: jeszcze nierozpoczete.

## 1. Wykryty stack

- Next.js 16.2.2 z App Routerem i Route Handlers,
- React 19 i TypeScript,
- PostgreSQL 16 oraz sterownik `pg`,
- wlasny, jednokierunkowy system migracji SQL,
- Docker Compose, obraz Next.js `standalone`,
- Nginx Proxy Manager jako reverse proxy,
- sesje bazodanowe w ciasteczku `spc_session`,
- hasla hashowane bcrypt z kosztem 12.

## 2. Stan obecny

Logowanie uzywa losowego tokenu sesji. W bazie zapisywany jest tylko jego hash.
Ciasteczko jest `HttpOnly`, `SameSite=Lax` i `Secure` na produkcji.

Model platformy zawiera juz:

- `users` i `user_sessions`,
- `courses`, `course_modules` i `lessons`,
- `purchases` i `purchase_items`,
- `payment_events`,
- `access_grants`,
- postep lekcji i notatki.

Nie nalezy tworzyc osobnych tabel `orders`, `course_access` ani `enrollments`.
Zakup jest reprezentowany przez `purchases`, a dostep przez `access_grants`.

Obecny checkout `/api/checkout/test`:

- nie pobiera pieniedzy,
- tworzy zakup o dostawcy `test`,
- nadaje `all_access`,
- jest sterowany przez `ENABLE_TEST_CHECKOUT`.

Katalog i panel pobieraja obecnie kursy z `content/courses.ts`. Tabela `courses`
nie jest jeszcze zrodlem oferty widocznej na stronie.

### Ustalone decyzje produktowe

- startujemy od dwoch kursow sprzedawanych jednorazowo,
- cena startowa kazdego kursu wynosi 149 PLN,
- filmy na pierwszym etapie sa przechowywane na VPS z limitem 200 GB,
- Przelewy24 jest docelowym operatorem platnosci,
- administrator zachowuje dostep do wszystkich materialow bez zakupu,
- katalog kursow pozostaje publiczny, a lekcje, biblioteka i notatki wymagaja
  aktywnego dostepu.

## 3. Najwazniejsze ryzyka przed produkcja

1. Cena i status kursu musza pochodzic z PostgreSQL, nie z frontendu ani stalej
   TypeScript.
2. Checkout testowy nie moze byc aktywny po uruchomieniu prawdziwej sprzedazy.
3. Logowanie nie ma jeszcze kompletnego limitowania prob, resetu hasla ani
   weryfikacji adresu e-mail.
4. Nie istnieja jeszcze chronione trasy lekcji, plikow i filmow.
5. Dokumenty prawne i zgody dla tresci cyfrowych nie sa gotowe.
6. Migracje sa tylko w przod. Cofniecie wymaga migracji naprawczej lub
   przywrocenia backupu PostgreSQL.
7. Domyslne hasla bazy z przykladowej konfiguracji nie nadaja sie do produkcji.
8. Filmy nie moga trafic do katalogu `public` ani do obrazu aplikacji. Taki plik
   bylby dostepny bez kontroli uprawnien lub zniknalby przy przebudowie kontenera.

## 4. Oficjalny kontrakt Przelewy24

Zrodlo: https://developers.przelewy24.pl/

Sprawdzona wersja dokumentacji REST: `1.0.17`.

- Sandbox API: `https://sandbox.przelewy24.pl/api/v1`
- Production API: `https://secure.przelewy24.pl/api/v1`
- rejestracja: `POST /transaction/register`
- weryfikacja: `PUT /transaction/verify`
- test danych API: `GET /testAccess`
- autoryzacja: Basic Auth, `user=posId`, `password=secretId/API key`
- podpisy: SHA-384 z dokladnie okreslonych obiektow JSON i klucza CRC

Adres bazowy musi wynikac wylacznie z `P24_ENV=sandbox|production`. Nie bedzie
konfigurowalnej zmiennej `P24_BASE_URL`.

Przelewy24 wysyla `urlStatus` tylko dla poprawnej wplaty. Powrot klienta przez
`urlReturn` nie potwierdza zaplaty. Po notyfikacji backend musi wywolac
`transaction/verify`; dopiero sukces tej operacji pozwala oznaczyc zakup jako
`paid`.

Identyfikator `orderId` P24 jest typu `int64`. Istniejace pole
`provider_order_id text` przechowa go bez ryzyka przepelnienia 32-bitowego typu.

## 5. Etapy wdrozenia

### Etap 0 - audyt i zabezpieczenie prac

- zapisac ten plan,
- nie modyfikowac danych produkcyjnych recznie,
- wykonac backup przed kazda migracja,
- utrzymac P24 w stanie `P24_ENABLED=false`.

### Etap 1 - fundament danych i testow

- rozszerzyc `purchases` o publiczny numer zamowienia, `provider_session_id`,
  token rejestracji, e-mail kupujacego oraz daty rejestracji i wygasniecia,
- dodac unikalnosc sesji dostawcy,
- zagwarantowac jeden dostep danego typu z jednego zakupu,
- dodac testy podpisow P24.

### Etap 2 - katalog z PostgreSQL

- [x] dodac dwa pierwsze kursy i ich ceny,
- [x] dodac bezpieczny seed w migracji,
- [x] wyswietlac publicznie tylko kursy `published`,
- [x] pobierac cene i walute wylacznie z bazy,
- [x] pozostawic sprzedaz wylaczona przez `sales_enabled=false`,
- [x] ograniczyc panel uzytkownika do kursow wynikajacych z `access_grants`.

Migracja `003_course_catalog.sql` dodaje dwa kursy po 149 PLN. Sa widoczne w
katalogu jako przygotowywane, ale nie mozna jeszcze rozpoczac dla nich prawdziwej
platnosci.

### Etap 3 - ochrona tresci

- dodac trasy kursu, modulu i lekcji,
- sprawdzac `access_grants` po stronie serwera dla kazdego zasobu,
- przechowywac filmy w osobnym katalogu lub woluminie VPS poza `public`,
- wydawac filmy dopiero po autoryzacji, docelowo przez wewnetrzne przekierowanie
  serwera WWW zamiast przesylania calego pliku przez proces Next.js,
- obslugiwac zadania zakresowe HTTP potrzebne do przewijania filmu,
- zabezpieczyc pliki, notatki i zapis postepu,
- administrator zachowuje pelny dostep.

Limit 200 GB powinien wystarczyc na dwa pierwsze kursy, ale przed publikacja
nalezy zmierzyc rzeczywisty rozmiar wszystkich wariantow wideo i zachowac zapas
na system, baze, logi i backupy. Backup filmow musi znajdowac sie poza tym samym
VPS. Zewnetrzny hosting wideo stanie sie kolejnym krokiem dopiero wtedy, gdy
transfer, liczba uzytkownikow lub obsluga kilku jakosci zaczna obciazac serwer.

### Etap 4 - klient P24 bez publicznego checkoutu

- walidowac komplet konfiguracji,
- dodac klienta z timeoutem i bezpiecznymi bledami,
- zaimplementowac `testAccess`, rejestracje i weryfikacje,
- mockowac wszystkie polaczenia w testach.

### Etap 5 - tworzenie platnosci

- wymagac zalogowania,
- przyjmowac tylko `courseId`,
- blokowac zakup posiadanego lub nieaktywnego kursu,
- tworzyc `pending` przed wywolaniem P24,
- generowac kryptograficzny `sessionId`,
- zapisywac token i przekierowywac na bramke.

### Etap 6 - idempotentna notyfikacja

- walidowac JSON notyfikacji i podpis,
- porownywac sprzedawce, sesje, kwote, walute i `orderId`,
- wykonac `transaction/verify`,
- w jednej transakcji bazy zapisac `paid`, zdarzenie i dostep,
- ponowne wywolanie ma zwracac sukces bez kolejnego dostepu.

Endpoint P24 nie bedzie uzywal ochrony CSRF przeznaczonej dla formularzy
przegladarki. Bedzie chroniony podpisem, weryfikacja API, ograniczeniem rozmiaru,
walidacja danych i bezpiecznym logowaniem.

### Etap 7 - frontend i status

- dodac przycisk `Kupuje i place`,
- wymagac niezaznaczonych domyslnie zgod,
- dodac `/platnosc/sukces` i `/platnosc/niepowodzenie`,
- strona sukcesu tylko odczytuje stan lokalnego zakupu,
- ograniczyc odpytywanie do maksymalnie 60 sekund.

### Etap 8 - panel i operacje

- panel uzytkownika pokazuje tylko posiadane kursy,
- panel administratora pokazuje zamowienia i zdarzenia,
- reczne nadanie dostepu jest osobna, audytowana operacja,
- nie dodawac przycisku recznego oznaczania platnosci jako `paid`.

### Etap 9 - Sandbox i uruchomienie

- skonfigurowac konto Sandbox oraz dozwolony adres IP VPS,
- wykonac `testAccess`,
- przetestowac sukces, odrzucenie, zla kwote i powtorzona notyfikacje,
- po akceptacji dokumentow prawnych ustawic `ENABLE_TEST_CHECKOUT=false`,
- produkcje P24 wlaczyc osobnym wdrozeniem i przegladem.

## 6. Bramki decyzyjne

Po etapach 2, 3, 6 i 9 nalezy zatrzymac prace, przedstawic wynik testow i uzyskac
akceptacje przed przejsciem dalej. Nie nalezy automatycznie wlaczac P24, zmieniac
sekretow na VPS ani wykonywac prawdziwych platnosci.

## 7. Backup przed migracja

Na VPS:

```bash
cd ~/strona-filipa
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/strona-$(date +%Y%m%d-%H%M%S).dump"
```

Sprawdzenie pliku:

```bash
ls -lh backups
```

Migracje uruchamiaja sie automatycznie przy starcie kontenera `strona`. Nie ma
automatycznego `down`; procedura przywracania backupu zostanie dopisana i
przetestowana przed pierwsza migracja zwiazana z aktywnym Sandboxem.
