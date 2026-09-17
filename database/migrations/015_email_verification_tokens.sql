CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_verification_tokens_user_created_idx
  ON email_verification_tokens(user_id, created_at DESC);

CREATE INDEX email_verification_tokens_active_idx
  ON email_verification_tokens(expires_at)
  WHERE used_at IS NULL;

-- Accounts created before verification was introduced remain usable. Accounts
-- created after this migration start with email_verified_at left NULL.
UPDATE users
SET email_verified_at = now()
WHERE email_verified_at IS NULL;
