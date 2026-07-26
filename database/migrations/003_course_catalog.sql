ALTER TABLE courses
  ADD COLUMN level_label text NOT NULL DEFAULT '',
  ADD COLUMN duration_label text NOT NULL DEFAULT '',
  ADD COLUMN sales_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE courses
  ADD CONSTRAINT courses_sales_enabled_valid CHECK (
    NOT sales_enabled
    OR (
      status = 'published'
      AND access_type = 'paid'
      AND price_cents IS NOT NULL
      AND price_cents > 0
    )
  );

INSERT INTO courses (
  slug,
  title,
  description,
  status,
  access_type,
  price_cents,
  currency,
  position,
  published_at,
  level_label,
  duration_label,
  sales_enabled
)
VALUES
  (
    'kregoslup-bez-przeciazen',
    'Kręgosłup bez przeciążeń',
    'Program dla osób z napięciem pleców, długim siedzeniem i potrzebą bezpiecznego powrotu do ruchu.',
    'published',
    'paid',
    14900,
    'PLN',
    1,
    now(),
    'Start',
    '4 moduły',
    false
  ),
  (
    'kark-barki-praca-siedzaca',
    'Kark i barki przy pracy siedzącej',
    'Ścieżka dla osób, które czują sztywność szyi, barków i górnych pleców po pracy przy biurku.',
    'published',
    'paid',
    14900,
    'PLN',
    2,
    now(),
    'Podstawowy',
    '5 modułów',
    false
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_modules (course_id, title, position)
SELECT courses.id, modules.title, modules.position
FROM courses
CROSS JOIN (
  VALUES
    ('Ocena napięcia i punkt wyjścia', 1),
    ('Mobilność odcinka piersiowego', 2),
    ('Biodra, oddech i stabilizacja', 3),
    ('Plan tygodniowy', 4)
) AS modules(title, position)
WHERE courses.slug = 'kregoslup-bez-przeciazen'
ON CONFLICT (course_id, position) DO NOTHING;

INSERT INTO course_modules (course_id, title, position)
SELECT courses.id, modules.title, modules.position
FROM courses
CROSS JOIN (
  VALUES
    ('Ergonomia bez dogmatów', 1),
    ('Ruch łopatek', 2),
    ('Oddech i żebra', 3),
    ('Szyja i górny odcinek pleców', 4),
    ('Rutyna 12 minut', 5)
) AS modules(title, position)
WHERE courses.slug = 'kark-barki-praca-siedzaca'
ON CONFLICT (course_id, position) DO NOTHING;
