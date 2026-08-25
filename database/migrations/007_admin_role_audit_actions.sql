ALTER TABLE admin_audit_events
  DROP CONSTRAINT IF EXISTS admin_audit_events_action_check;

ALTER TABLE admin_audit_events
  ADD CONSTRAINT admin_audit_events_action_check
  CHECK (
    action IN (
      'course_access_granted',
      'admin_role_granted',
      'admin_role_revoked'
    )
  );
