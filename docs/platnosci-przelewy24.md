# Platnosci Przelewy24 - status modulu

Stan dokumentu: 25 sierpnia 2026 r.

## Aktualny status

Platnosci nie sa aktualnie uzywane w publicznym przeplywie aplikacji. Model
dostepu zostal zmieniony na:

1. administrator generuje kod w `/panel/admin`,
2. administrator dodaje materialy w panelu,
3. uzytkownik zaklada konto lub loguje sie,
4. uzytkownik wpisuje kod na `/dostep`,
5. aktywny grant odblokowuje `/biblioteka` i materialy.

`/kup` przekierowuje na `/dostep`, a publiczne linki nie prowadza do checkoutu.

## Co zostalo w repozytorium

W kodzie nadal istnieja stare moduly:

- `app/lib/payments/*`,
- `app/api/checkout/*`,
- `app/api/payments/*`,
- strony `/platnosc/*`,
- testy jednostkowe P24 i symulatora.

Pozostaja jako nieaktywny zapas oraz zabezpieczenie przed przypadkowym
uszkodzeniem dawnych kontraktow. Nie sa czescia obecnego procesu uzytkownika.

Domyslna konfiguracja nadal utrzymuje:

```env
P24_ENABLED=false
TEST_PAYMENTS_ENABLED=false
```

Nie wlaczaj tych opcji, jezeli projekt ma dzialac w modelu kodow dostepu.

## Obecny model danych dla dostepu

Nowe elementy:

- `access_codes` - hash kodu, opis, limit uzyc, wygasniecie i blokada,
- `access_code_redemptions` - historia uzyc kodow,
- `access_grants.source='code'` - grant utworzony po wpisaniu kodu,
- dodatkowe metadane plikow w `library_items`.

Kody sa hashowane SHA-256. Jawny kod jest widoczny tylko raz po utworzeniu.

## Materialy

Materialy biblioteki sa zapisywane w `library_items` i opcjonalnie w storage na
dysku. Endpointy:

- `POST /api/admin/library-items` - dodanie, edycja, usuniecie materialu,
- `GET /api/library-items/{itemId}/media` - chronione wydanie pliku,
- `HEAD /api/library-items/{itemId}/media` - metadane pliku.

Dozwolone typy:

- MP4,
- WebM,
- PDF,
- DOCX,
- JPG,
- PNG.

## Jesli kiedys wrocisz do platnosci

Przed przywroceniem sprzedazy trzeba ponownie przejrzec i przetestowac caly
modul, bo obecne UI i dokumentacja sa juz ustawione pod kody. Minimalna lista:

- decyzja prawna i biznesowa o sprzedazy,
- finalny regulamin i polityka prywatnosci dla platnosci,
- przywrocenie linkow do `/kup`,
- sprawdzenie komponentu `CourseCheckout`,
- sprawdzenie tras `/platnosc/*`,
- pelny test Sandbox Przelewy24 na VPS,
- wlaczenie `P24_ENABLED=true` dopiero po testach,
- decyzja, jak kody maja wspolistniec z zakupami.

Bez tej pracy traktuj P24 jako kod nieaktywny.
