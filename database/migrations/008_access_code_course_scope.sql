ALTER TABLE access_codes
  DROP CONSTRAINT IF EXISTS access_codes_scope_check;

ALTER TABLE access_codes
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES courses(id) ON DELETE SET NULL;

ALTER TABLE access_codes
  ADD CONSTRAINT access_codes_scope_check
  CHECK (scope IN ('library', 'all_access', 'course'));

ALTER TABLE access_codes
  DROP CONSTRAINT IF EXISTS access_codes_scope_course_valid;

ALTER TABLE access_codes
  ADD CONSTRAINT access_codes_scope_course_valid
  CHECK (
    (scope = 'course' AND course_id IS NOT NULL)
    OR (scope <> 'course' AND course_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS access_codes_course_idx
  ON access_codes(course_id)
  WHERE course_id IS NOT NULL;
