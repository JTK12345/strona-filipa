CREATE TABLE admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_events_created_idx
  ON admin_audit_events(created_at DESC);

CREATE INDEX admin_audit_events_admin_idx
  ON admin_audit_events(admin_user_id, created_at DESC);

COMMENT ON TABLE admin_audit_events IS
  'Append-only audit trail for manual administrative operations.';
