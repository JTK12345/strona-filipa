# Spójny wygląd wszystkich podstron użytkownika

Kontynuacja redesignu na prośbę użytkownika: po kliknięciu „Umów analizę” i pozostałych kart nie można wracać do poprzedniego wyglądu.

## Wdrożenie

- Nowy nagłówek i stopka na wszystkich trasach publicznych oraz użytkownika.
- PublicPage stosuje fonty i moduł CSS do podstron, formularzy, konta, biblioteki, kursów i lekcji.
- Formularz konsultacji: szałwiowy nagłówek z limonkowym kołem, serifowe tytuły, dwie karty oferty, ciemna karta konsultacji stacjonarnej, nowy wygląd pól i kontaktu.
- Katalog /kursy współdzieli AcademyCard ze stroną główną. Pobieranie kursów i sprawdzanie dostępu pozostaje bez zmian.
- Logowanie, rejestracja, oba widoki resetu hasła, aktywacja kodu i dokumenty prawne mają nową typografię, kolorystykę i przyciski.
- Style obejmują także konto, bibliotekę, szczegół materiału, moduły, lekcje, notatki i postęp.
- /panel/admin i jego podstrony są jawnie wyłączone z nowego wyglądu, zgodnie z pierwotnym wymaganiem.
- Menu zamyka się przy zmianie trasy i po kliknięciu brandingu. Formularze, API, kontrola dostępu i baza pozostają bez zmian.
- Dodano wymagane przez Next.js 16 data-scroll-behavior="smooth": przejścia między stronami nie uruchamiają niepożądanej animacji przewijania i nie zgłaszają ostrzeżenia.

## Zmienione / dodane pliki w tej kontynuacji

- app/layout.tsx
- app/kursy/page.tsx
- app/umow-konsultacje/page.tsx
- components/layout/HomeChrome.tsx
- components/layout/LandingHeader.tsx
- components/layout/PublicPage.tsx (nowy)
- components/layout/public-pages.module.css (nowy)
- components/sections/Academy.tsx
- docs/REDESIGN-PODSTRONY-2026-09-15.md (ten raport)

## Testy przejść w przeglądarce

- Header „Umów analizę” → nowy widok konsultacji.
- „Umów online” i „Umów wizytę” → istniejący formularz #formularz z akcją /api/appointment.
- Każda z trzech kart strony głównej sprawdzona kliknięciem na telefonie:
  - analiza → /umow-konsultacje;
  - biblioteka → /logowanie?next=/biblioteka (prawidłowe wymaganie logowania);
  - Akademia → /kursy.
- Logowanie → rejestracja → regulamin → polityka prywatności → katalog kursów.
- Kursy → aktywacja kodu → logowanie → reset hasła.
- Program kursu rozwija listę modułów.
- Menu mobilne otwiera się na podstronie i zamyka po przejściu do konsultacji.
- Wszystkie sprawdzone cele zachowują nowy header, stopkę, font nagłówków i data-public-design="sage".
- Dziewięć podstron sprawdzonych przy 320 i 768 px: konsultacje, logowanie, rejestracja, reset hasła, nowe hasło (stan bez tokenu), dostęp, kursy, regulamin, polityka prywatności. Brak przewijania poziomego.
- Dodatkowa kontrola wizualna przy 390 px i na desktopie.
- Brak nowych błędów i ostrzeżeń konsoli podczas końcowej kontroli przejść.

## Regresja

- npm run build — OK.
- npm run lint — OK.
- npm test — 10/10.
- 33 sprawdzenia HTTP — bez błędów 5xx, zachowane wymagania logowania i ochrony API.
- Żaden istniejący plik trasy nie został usunięty.
- Zachowano aktualne ceny i źródła danych.

## Ograniczenia

Lokalnie nie ma skonfigurowanego PostgreSQL. Widoki konta, biblioteki i lekcji objęto stylami na podstawie istniejących komponentów, lecz nie przetestowano ich z prawdziwą sesją i danymi. Nadal wymagają testu po podłączeniu bazy i kont obu ról. Nie wysyłano rzeczywistych zgłoszeń ani wiadomości.

Zmiany są lokalne, bez publikacji na VPS. Ten raport zastępuje wcześniejsze ograniczenie redesignu wyłącznie do strony głównej opisane w REDESIGN-2026-09-14.md.
