INSERT INTO lessons (
  module_id,
  slug,
  title,
  summary,
  content_markdown,
  status,
  position,
  is_preview
)
SELECT
  course_modules.id,
  seed.lesson_slug,
  seed.lesson_title,
  seed.summary,
  seed.content_markdown,
  'published',
  1,
  false
FROM (
  VALUES
    (
      'kregoslup-bez-przeciazen',
      1,
      'punkt-wyjscia',
      'Punkt wyjścia i obserwacja napięcia',
      'Spokojna ocena aktualnego samopoczucia przed rozpoczęciem programu.',
      E'## Cel lekcji\n\nZapisz, w jakich sytuacjach pojawia się napięcie i jak reaguje na krótki, spokojny ruch.\n\n## Zadanie\n\nWykonaj obserwację bez prowokowania bólu i zanotuj punkt wyjścia.'
    ),
    (
      'kregoslup-bez-przeciazen',
      2,
      'ruch-odcinka-piersiowego',
      'Ruch odcinka piersiowego',
      'Łagodna praktyka poprawiająca swobodę ruchu górnej części tułowia.',
      E'## Cel lekcji\n\nPoznaj ruchy, które możesz wykonywać w małym, komfortowym zakresie.\n\n## Zadanie\n\nWybierz dwa ćwiczenia i wykonaj je w spokojnym tempie.'
    ),
    (
      'kregoslup-bez-przeciazen',
      3,
      'biodra-oddech-stabilizacja',
      'Biodra, oddech i stabilizacja',
      'Połączenie oddechu, pracy bioder i kontroli tułowia.',
      E'## Cel lekcji\n\nZbuduj prostą sekwencję łączącą oddech z ruchem bioder.\n\n## Zadanie\n\nWykonaj sekwencję bez wstrzymywania oddechu.'
    ),
    (
      'kregoslup-bez-przeciazen',
      4,
      'plan-tygodniowy',
      'Plan tygodniowy',
      'Praktyczny plan powtarzania materiału bez przeciążania organizmu.',
      E'## Cel lekcji\n\nUstal realną częstotliwość krótkiej praktyki.\n\n## Zadanie\n\nWpisz trzy terminy pracy z materiałem na najbliższy tydzień.'
    ),
    (
      'kark-barki-praca-siedzaca',
      1,
      'ergonomia-bez-dogmatow',
      'Ergonomia bez dogmatów',
      'Ustawienie stanowiska jako punkt wyjścia, a nie jedyne rozwiązanie.',
      E'## Cel lekcji\n\nSprawdź, które elementy stanowiska faktycznie wpływają na Twój komfort.\n\n## Zadanie\n\nZmień jeden element i obserwuj efekt przez dwa dni.'
    ),
    (
      'kark-barki-praca-siedzaca',
      2,
      'ruch-lopatek',
      'Ruch łopatek',
      'Podstawowe kierunki ruchu łopatek i ich spokojna kontrola.',
      E'## Cel lekcji\n\nPoznaj zakres ruchu łopatek bez nadmiernego napinania szyi.\n\n## Zadanie\n\nWykonaj serię wolnych powtórzeń w komfortowym zakresie.'
    ),
    (
      'kark-barki-praca-siedzaca',
      3,
      'oddech-i-zebra',
      'Oddech i żebra',
      'Praktyka swobodnego oddechu połączona z ruchem klatki piersiowej.',
      E'## Cel lekcji\n\nZaobserwuj ruch żeber w różnych pozycjach.\n\n## Zadanie\n\nWykonaj trzy minuty spokojnej praktyki oddechowej.'
    ),
    (
      'kark-barki-praca-siedzaca',
      4,
      'szyja-i-gorne-plecy',
      'Szyja i górny odcinek pleców',
      'Łagodne ruchy szyi połączone z pracą górnej części pleców.',
      E'## Cel lekcji\n\nRozdziel ruch szyi od niepotrzebnego unoszenia barków.\n\n## Zadanie\n\nWykonaj krótką serię i zanotuj odczucia po zakończeniu.'
    ),
    (
      'kark-barki-praca-siedzaca',
      5,
      'rutyna-12-minut',
      'Rutyna 12 minut',
      'Krótka sekwencja do wykorzystania podczas dnia pracy.',
      E'## Cel lekcji\n\nPołącz poznane elementy w jedną prostą rutynę.\n\n## Zadanie\n\nWykonaj rutynę raz dziennie przez trzy dni i zapisz obserwacje.'
    )
) AS seed(
  course_slug,
  module_position,
  lesson_slug,
  lesson_title,
  summary,
  content_markdown
)
JOIN courses ON courses.slug = seed.course_slug
JOIN course_modules
  ON course_modules.course_id = courses.id
  AND course_modules.position = seed.module_position
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX user_notes_user_lesson_unique
  ON user_notes(user_id, lesson_id)
  WHERE lesson_id IS NOT NULL;
