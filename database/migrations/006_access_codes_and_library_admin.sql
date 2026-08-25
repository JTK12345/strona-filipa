ALTER TABLE access_grants
  DROP CONSTRAINT IF EXISTS access_grants_source_check;

ALTER TABLE access_grants
  ADD CONSTRAINT access_grants_source_check
  CHECK (source IN ('purchase', 'admin', 'migration', 'code'));

CREATE TABLE access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT 'all_access' CHECK (scope IN ('library', 'all_access')),
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (used_count <= max_uses)
);

CREATE INDEX access_codes_active_idx
  ON access_codes(created_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE access_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id uuid NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (access_code_id, user_id)
);

ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint CHECK (
    file_size_bytes IS NULL OR file_size_bytes >= 0
  );

CREATE TRIGGER access_codes_set_updated_at
BEFORE UPDATE ON access_codes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
