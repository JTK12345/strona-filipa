ALTER TABLE access_grants
  DROP CONSTRAINT IF EXISTS access_grants_source_check;

ALTER TABLE access_grants
  DROP COLUMN IF EXISTS purchase_id;

UPDATE access_grants
SET source = 'migration'
WHERE source = 'purchase';

ALTER TABLE access_grants
  ADD CONSTRAINT access_grants_source_check
  CHECK (source IN ('admin', 'migration', 'code'));

ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_sales_enabled_valid;

ALTER TABLE courses
  DROP COLUMN IF EXISTS sales_enabled,
  DROP COLUMN IF EXISTS price_cents,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS access_type;

DROP TABLE IF EXISTS payment_events;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
