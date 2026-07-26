ALTER TABLE purchases
  ADD COLUMN public_order_number text,
  ADD COLUMN provider_session_id text,
  ADD COLUMN provider_token text,
  ADD COLUMN buyer_email text,
  ADD COLUMN provider_registered_at timestamptz,
  ADD COLUMN expires_at timestamptz;

UPDATE purchases
SET public_order_number = 'PC-' || upper(substr(replace(id::text, '-', ''), 1, 12))
WHERE public_order_number IS NULL;

UPDATE purchases
SET buyer_email = users.email
FROM users
WHERE purchases.user_id = users.id
  AND purchases.buyer_email IS NULL;

ALTER TABLE purchases
  ALTER COLUMN public_order_number SET NOT NULL,
  ALTER COLUMN buyer_email SET NOT NULL;

CREATE UNIQUE INDEX purchases_public_order_number_unique
  ON purchases(public_order_number);

CREATE UNIQUE INDEX purchases_provider_session_unique
  ON purchases(provider, provider_session_id)
  WHERE provider_session_id IS NOT NULL;

CREATE INDEX purchases_user_status_created_idx
  ON purchases(user_id, status, created_at DESC);

CREATE UNIQUE INDEX access_grants_purchase_scope_course_unique
  ON access_grants(purchase_id, scope, course_id) NULLS NOT DISTINCT
  WHERE purchase_id IS NOT NULL;

COMMENT ON COLUMN purchases.provider_order_id IS
  'Provider transaction identifier. Stored as text to safely preserve P24 int64 orderId.';

COMMENT ON COLUMN purchases.provider_session_id IS
  'Unique merchant-side session identifier sent to the payment provider.';

COMMENT ON COLUMN purchases.provider_token IS
  'Short-lived token returned when the provider registers a payment.';
