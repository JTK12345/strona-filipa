# Platnosci Przelewy24 - architektura i stan

Stan dokumentu: 27 lipca 2026 r.

## Status

Etapy implementacyjne 0-8 sa zakonczone w kodzie. Etap 9 jest gotowy od strony
narzedzi i instrukcji, ale wymaga zewnetrznych danych Sandbox oraz decyzji
prawnych wlasciciela:

- [x] konfiguracja `sandbox|production` bez dowolnego `P24_BASE_URL`,
- [x] klient `testAccess`, register i verify z timeoutem,
- [x] tworzenie `pending` przed kontaktem z operatorem,
- [x] cena i waluta tylko z PostgreSQL,
- [x] kryptograficzny `sessionId`,
- [x] podpisy SHA-384,
- [x] bezstratny `orderId` int64,
- [x] idempotentny callback i atomowy grant,
- [x] chroniony status zamowienia,
- [x] frontend zakupu, zgody i limit pollingu 60 sekund,
- [x] panel uzytkownika i administratora,
- [x] audytowane reczne nadanie dostepu,
- [x] usuniety publiczny checkout testowy,
- [ ] prawdziwe dane konta P24 Sandbox,
- [ ] poprawny `testAccess` wykonany z VPS,
- [ ] pelne scenariusze platnosci w Sandbox,
- [ ] finalne dokumenty prawne i potwierdzenie umowy e-mailem,
- [ ] osobna akceptacja uruchomienia produkcji.

P24 i sprzedaz kursow pozostaja domyslnie wylaczone.

## Oficjalny kontrakt

Zrodla:

- https://developers.przelewy24.pl/
- https://developers.przelewy24.pl/yaml/pl_documentation_1.0.yaml

Sprawdzona dokumentacja REST: wersja `1.0.17`.

- Sandbox API: `https://sandbox.przelewy24.pl/api/v1`
- Production API: `https://secure.przelewy24.pl/api/v1`
- `GET /testAccess`
- `POST /transaction/register`
- `PUT /transaction/verify`
- Basic Auth: uzytkownik `posId`, haslo `API key/secretId`
- podpisy: SHA-384 z obiektu JSON i CRC

`urlReturn` nie potwierdza zaplaty. Dostep moze powstac tylko po notyfikacji
`urlStatus` i sukcesie `transaction/verify`.

## Model danych

Nie ma osobnej tabeli `orders`. Uzywane sa:

- `purchases` - zamowienie i stan platnosci,
- `purchase_items` - zakupiony kurs i cena w chwili zakupu,
- `payment_events` - odebrane notyfikacje i bledy,
- `access_grants` - aktywny dostep,
- `admin_audit_events` - reczne operacje administratora.

Najwazniejsze identyfikatory:

- `public_order_number` - bezpieczny numer pokazywany uzytkownikowi,
- `provider_session_id` - unikalna sesja wysylana do P24,
- `provider_token` - token rejestracji,
- `provider_order_id` - `orderId` P24 zapisany jako tekst.

## Tworzenie zakupu

`POST /api/checkout/przelewy24`:

1. wymaga sesji i poprawnego Origin,
2. ogranicza czestotliwosc wywolan,
3. przyjmuje `courseId` i dwa wymagane potwierdzenia zgody,
4. pobiera kurs, cene, walute i `sales_enabled` z bazy,
5. blokuje administratora i konto z istniejacym dostepem,
6. tworzy `purchases.status='pending'` oraz `purchase_items`,
7. rejestruje transakcje w P24,
8. zapisuje token i zwraca oficjalny adres bramki.

Nieudana rejestracja zmienia probe na `failed`. Tresc bledu operatora nie jest
zwracana klientowi.

## Callback

`POST /api/payments/przelewy24/status` nie uzywa CSRF. Wykonuje:

1. limit 32 KiB i bezstratne parsowanie JSON z odrzuceniem duplikatow kluczy,
2. walidacje typow i int64,
3. porownanie Merchant ID, POS ID i PLN,
4. timing-safe porownanie podpisu,
5. zapis/aktualizacje `payment_events`,
6. porownanie sesji, kwoty, ceny pozycji, waluty i `orderId`,
7. `PUT /transaction/verify`,
8. transakcje PostgreSQL: `paid`, `provider_order_id`, grant i processed event.

Powtorzona notyfikacja zwraca sukces bez kolejnego verify i bez drugiego grantu.
Rownolegla notyfikacja jest ponownie sprawdzana po blokadzie rekordu.

## Status uzytkownika

`GET /api/purchases/{publicOrderNumber}/status` wymaga sesji i filtruje zakup po
`user_id`. Nie mozna odczytac cudzego zamowienia. Strona powrotu odpytuje status
co 2 sekundy, najwyzej przez 60 sekund. Sama niczego nie oznacza jako zaplacone.

## Administrator

`/panel/admin` pokazuje:

- ostatnie zamowienia,
- zdarzenia platnicze bez surowego payloadu,
- audyt recznych grantow,
- formularz nadania kursu,
- przycisk `testAccess`.

Nie ma i nie powinno byc przycisku `Oznacz jako paid`.

## Konfiguracja

```env
APP_URL=https://profil-ciala.jtk.ovh
P24_ENABLED=false
P24_ENV=sandbox
P24_MERCHANT_ID=
P24_POS_ID=
P24_API_KEY=
P24_CRC=
P24_HTTP_TIMEOUT_MS=8000
```

Gdy `P24_ENABLED=false`, puste dane sa prawidlowe. Gdy jest `true`, aplikacja
wymaga kompletu, dodatnich identyfikatorow i publicznego HTTPS `APP_URL`.

## Uruchomienie Sandbox

Pelna procedura jest w `WGRAC_NA_VPS.md`. Kolejnosc:

1. backup,
2. dane Sandbox i IP VPS w panelu P24,
3. `P24_ENABLED=true`, `P24_ENV=sandbox`,
4. rebuild,
5. `testAccess` z `/panel/admin`,
6. wlaczenie `sales_enabled` skryptem,
7. scenariusze sukcesu i anulowania,
8. kontrola panelu, eventow i duplikatu,
9. ponowne wylaczenie sprzedazy po testach.

## Dokumenty prawne

`/regulamin` i `/polityka-prywatnosci` sa projektami, nie finalnymi dokumentami.
Przed sprzedaza potrzebne sa dane sprzedawcy, zasady reklamacji, dostarczania
tresci cyfrowych, odstapienia, wymagania techniczne, okres dostepu i zasady
przetwarzania danych.

Oficjalne informacje UOKiK o tresciach cyfrowych:
https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/wylaczenia-prawa-do-odstapienia/

Sama zgoda w checkboxie nie wystarcza. Nalezy przekazac konsumentowi
potwierdzenie zawarcia umowy i otrzymanej zgody na trwalym nosniku.

## Testy

`npm test` obejmuje:

- podpisy register, verify i callback,
- stala konfiguracje hostow,
- Basic Auth klienta i kontrolowane bledy,
- kolejnosc `pending -> register -> token`,
- blad rejestracji,
- zla kwote i zly podpis callbacku,
- powtorzona notyfikacje,
- maksymalny `orderId` int64,
- sciezki i zakresy filmow,
- rate limiting i scisle rozpoznawanie loopback.

Wszystkie wywolania P24 w testach sa mockowane. Testy nie wykonuja prawdziwej
platnosci.
