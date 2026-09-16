# Nowy wygląd panelu administratora

Zakres z 16.09.2026 rozszerza wcześniejszą przebudowę o wszystkie siedem zakładek administratora: zgłoszenia, kursy, materiały, kody, użytkownicy, dostępy i historię zmian. Wcześniejsze wzmianki o wyłączeniu admina z redesignu opisują stan sprzed tej zmiany.

Panel korzysta z tych samych lokalnych fontów, kremowego tła, szałwiowej zieleni oraz ciemnych przycisków co strona publiczna. Ma osobny, skrócony nagłówek i stopkę, tytuł dopasowany do sekcji oraz aktywną zakładkę oznaczoną wizualnie i przez `aria-current`. Nowe style obejmują karty zgłoszeń, filtry, tabele, formularze, wybór osób, upload plików i okna edycji kursów, modułów oraz lekcji. Ukryte sekcje zachowują `display: none` niezależnie od układów grid.

Nie zmieniono pobierania danych, sprawdzania sesji i roli administratora ani tras API i pól formularzy.

Weryfikacja lokalna:

- Wszystkie siedem zakładek: przejścia, tytuły, aktywna pozycja i ukrywanie pozostałych sekcji.
- Widoki 1280 px i 320 px: brak poziomego przepełnienia strony. Tabele mają własne przewijanie.
- Karta zgłoszenia z danymi testowymi i formularzem statusu/notatki.
- Rozwijanie modułów, otwieranie edycji lekcji i tworzenia kursu, zamykanie okna klawiszem Escape.
- Okno kursu na 320 px: mieści się w ekranie, pola przewijają się wewnątrz okna.
- `npm test`: 13/13. `npm run lint` i `npm run build`: OK.

Do weryfikacji wyglądu użyto tymczasowej kopii widoku z fikcyjnymi danymi, dostępnej wyłącznie na lokalnym serwerze developerskim. Usunięto ją przed budowaniem wersji produkcyjnej. Nie zmieniano zabezpieczeń rzeczywistych tras panelu. Bez lokalnej bazy i sesji administratora nie testowano zapisu do bazy, uploadu ani wysyłania wiadomości. Wdrożenie na VPS jest osobnym krokiem.
